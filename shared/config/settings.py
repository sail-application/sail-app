# =============================================================================
# settings.py - Central configuration loader for SAIL CRM Engine
# =============================================================================
# Loads environment variables from .env and validates that required keys are
# present. Any module can import from here to get config values.
#
# Usage:
#   from shared.config.settings import get_config
#   config = get_config()
#   api_key = config["GOOGLE_PLACES_API_KEY"]
# =============================================================================

import os
import sys
from pathlib import Path
from dotenv import load_dotenv


def get_project_root():
    """Walk up from this file to find the project root (where .env lives)."""
    current = Path(__file__).resolve()
    # Go up from shared/config/settings.py -> shared/config -> shared -> project root
    return current.parent.parent.parent


def load_env():
    """
    Load .env file from the project root.
    Returns True if .env was found and loaded, False otherwise.
    """
    root = get_project_root()
    env_path = root / ".env"

    if env_path.exists():
        load_dotenv(env_path)
        return True
    else:
        # Still try to load from current working directory as fallback
        load_dotenv()
        return False


def get_config(required_keys=None):
    """
    Load environment variables and return them as a dictionary.

    Args:
        required_keys: List of env var names that MUST be set. If any are
                       missing, the program prints a clear error and exits.
                       Pass None to skip validation (useful for dry runs).

    Returns:
        Dictionary of all relevant config values.
    """
    load_env()

    config = {
        # Zoho Bigin
        "ZOHO_API_TOKEN": os.getenv("ZOHO_API_TOKEN", ""),
        "ZOHO_BIGIN_BASE_URL": os.getenv("ZOHO_BIGIN_BASE_URL", "https://www.zohoapis.com/bigin/v2"),

        # Google Places
        "GOOGLE_PLACES_API_KEY": os.getenv("GOOGLE_PLACES_API_KEY", ""),

        # Hunter.io
        "HUNTER_API_KEY": os.getenv("HUNTER_API_KEY", ""),

        # Apollo.io
        "APOLLO_API_KEY": os.getenv("APOLLO_API_KEY", ""),

        # Search defaults
        "DEFAULT_SEARCH_LOCATION": os.getenv("DEFAULT_SEARCH_LOCATION", "San Antonio, TX"),
        "DEFAULT_SEARCH_RADIUS": int(os.getenv("DEFAULT_SEARCH_RADIUS", "40000")),
    }

    # Validate required keys if specified
    if required_keys:
        missing = [k for k in required_keys if not config.get(k)]
        if missing:
            print("\n[ERROR] Missing required environment variables:")
            for key in missing:
                print(f"  - {key}")
            print("\nPlease set them in your .env file. See .env.example for reference.")
            sys.exit(1)

    return config
