# =============================================================================
# helpers.py - Reusable utility functions for SAIL CRM Engine
# =============================================================================
# Common functions used across modules: logging setup, phone formatting,
# safe API calls with retries, CSV writing, etc.
# =============================================================================

import csv
import logging
import time
from datetime import datetime
from pathlib import Path


def setup_logger(name, log_file=None, level=logging.INFO):
    """
    Create a logger that writes to both console and (optionally) a file.

    Args:
        name: Logger name (usually the module name).
        log_file: Optional path to a log file.
        level: Logging level (default: INFO).

    Returns:
        Configured logger instance.
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)

    # Avoid adding duplicate handlers if logger already exists
    if logger.handlers:
        return logger

    formatter = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    # Console handler - always present
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # File handler - optional
    if log_file:
        log_dir = Path(log_file).parent
        log_dir.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    return logger


def format_phone(phone_str):
    """
    Clean and format a US phone number string.
    Strips non-digit characters and formats as (XXX) XXX-XXXX.

    Args:
        phone_str: Raw phone string from any source.

    Returns:
        Formatted phone string, or original if it can't be parsed.
    """
    if not phone_str:
        return ""

    # Strip everything except digits
    digits = "".join(c for c in phone_str if c.isdigit())

    # Handle country code prefix
    if len(digits) == 11 and digits.startswith("1"):
        digits = digits[1:]

    # Format if we have exactly 10 digits
    if len(digits) == 10:
        return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"

    # Return cleaned version if can't format
    return phone_str.strip()


def safe_api_call(func, *args, max_retries=3, backoff_base=2, **kwargs):
    """
    Wrap an API call with retry logic and exponential backoff.

    Args:
        func: The function to call (should return a requests.Response or similar).
        *args: Positional arguments for func.
        max_retries: Number of retries before giving up.
        backoff_base: Base seconds for exponential backoff (2 = 2s, 4s, 8s).
        **kwargs: Keyword arguments for func.

    Returns:
        The return value of func.

    Raises:
        The last exception if all retries fail.
    """
    last_exception = None

    for attempt in range(max_retries + 1):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            last_exception = e
            if attempt < max_retries:
                wait_time = backoff_base ** (attempt + 1)
                logging.getLogger("helpers").warning(
                    f"API call failed (attempt {attempt + 1}/{max_retries + 1}): {e}. "
                    f"Retrying in {wait_time}s..."
                )
                time.sleep(wait_time)

    raise last_exception


def write_leads_to_csv(leads, output_path, fieldnames=None):
    """
    Write a list of lead dictionaries to a CSV file.

    Args:
        leads: List of dicts, each representing a lead.
        output_path: Path where CSV will be written.
        fieldnames: Optional list of column names. If None, inferred from
                    the first lead's keys.

    Returns:
        Path to the written file.
    """
    if not leads:
        logging.getLogger("helpers").warning("No leads to write to CSV.")
        return None

    # Ensure output directory exists
    output_dir = Path(output_path).parent
    output_dir.mkdir(parents=True, exist_ok=True)

    # Use provided fieldnames or infer from first lead
    if not fieldnames:
        fieldnames = list(leads[0].keys())

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(leads)

    return output_path


def generate_output_filename(prefix="leads", extension="csv"):
    """
    Generate a timestamped output filename.

    Returns:
        String like "leads_2026-02-11_143022.csv"
    """
    timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    return f"{prefix}_{timestamp}.{extension}"


def deduplicate_leads(leads, key_field="name"):
    """
    Remove duplicate leads based on a key field (default: business name).
    Uses case-insensitive comparison and keeps the first occurrence.

    Args:
        leads: List of lead dicts.
        key_field: The field to deduplicate on.

    Returns:
        Deduplicated list of leads.
    """
    seen = set()
    unique = []

    for lead in leads:
        # Normalize the key for comparison (lowercase, strip whitespace)
        key_value = lead.get(key_field, "").strip().lower()

        if key_value and key_value not in seen:
            seen.add(key_value)
            unique.append(lead)
        elif not key_value:
            # Keep leads even if key field is empty (can't deduplicate)
            unique.append(lead)

    return unique
