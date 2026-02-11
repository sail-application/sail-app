# =============================================================================
# client.py - Zoho Bigin CRM Client
# =============================================================================
# Handles all communication with the Zoho Bigin API. Creates contacts and
# pipeline records for new leads found by the lead generation tool.
#
# Key design decisions:
#   - Never overwrites existing records (checks for duplicates first)
#   - Includes boolean tracking fields for enrichment sources
#   - Supports dry-run mode (returns what WOULD be created without writing)
#   - All API calls have error handling and retry logic
#
# Bigin API docs: https://www.bigin.com/developer/docs/apis/
# =============================================================================

import logging
import time
import requests

logger = logging.getLogger("bigin.client")


class BiginClient:
    """
    Client for Zoho Bigin CRM API. Handles authentication, record creation,
    duplicate checking, and field mapping.
    """

    def __init__(self, api_token, base_url="https://www.zohoapis.com/bigin/v2"):
        """
        Args:
            api_token: Zoho Bigin OAuth token or API key.
            base_url: Bigin API base URL (varies by data center region).
        """
        self.api_token = api_token
        self.base_url = base_url.rstrip("/")
        self.headers = {
            "Authorization": f"Zoho-oauthtoken {api_token}",
            "Content-Type": "application/json",
        }
        # Cache of existing records for duplicate checking
        self._existing_contacts = None

    def test_connection(self):
        """
        Test the API connection by fetching the Contacts module metadata.
        Returns True if connected successfully, False otherwise.
        """
        try:
            response = requests.get(
                f"{self.base_url}/Contacts",
                headers=self.headers,
                params={"page": 1, "per_page": 1},
                timeout=15,
            )
            if response.status_code == 200:
                logger.info("Bigin API connection successful.")
                return True
            elif response.status_code == 401:
                logger.error("Bigin API authentication failed. Check your ZOHO_API_TOKEN.")
                return False
            else:
                logger.error(f"Bigin API returned status {response.status_code}: {response.text}")
                return False
        except requests.RequestException as e:
            logger.error(f"Bigin API connection failed: {e}")
            return False

    def get_existing_contacts(self, force_refresh=False):
        """
        Fetch all existing contacts from Bigin for duplicate checking.
        Results are cached to avoid repeated API calls.

        Returns:
            Dict mapping normalized company names to their Bigin record IDs.
        """
        if self._existing_contacts is not None and not force_refresh:
            return self._existing_contacts

        self._existing_contacts = {}
        page = 1

        logger.info("Fetching existing contacts from Bigin for duplicate checking...")

        while True:
            try:
                response = requests.get(
                    f"{self.base_url}/Contacts",
                    headers=self.headers,
                    params={"page": page, "per_page": 200},
                    timeout=15,
                )
                response.raise_for_status()
                data = response.json()

                records = data.get("data", [])
                if not records:
                    break

                for record in records:
                    # Use Company_Name as the dedup key
                    company = record.get("Company_Name", "")
                    if company:
                        normalized = company.strip().lower()
                        self._existing_contacts[normalized] = record.get("id")

                # Check if there are more pages
                info = data.get("info", {})
                if not info.get("more_records", False):
                    break

                page += 1
                time.sleep(0.3)  # Rate limit courtesy

            except requests.RequestException as e:
                logger.error(f"Failed to fetch contacts page {page}: {e}")
                break

        logger.info(f"Found {len(self._existing_contacts)} existing contacts in Bigin.")
        return self._existing_contacts

    def check_duplicate(self, lead):
        """
        Check if a lead already exists in Bigin by company name.

        Args:
            lead: Lead dict with at least a 'name' field.

        Returns:
            Bigin record ID if duplicate found, None otherwise.
        """
        existing = self.get_existing_contacts()
        normalized_name = lead.get("name", "").strip().lower()
        return existing.get(normalized_name)

    def create_contact(self, lead, dry_run=False):
        """
        Create a new Contact record in Bigin from a lead.

        Args:
            lead: Lead dict from the search engine.
            dry_run: If True, return the payload that WOULD be sent without
                     actually creating the record.

        Returns:
            Dict with 'status' ('created', 'duplicate', 'error', 'dry_run')
            and details.
        """
        # Check for duplicates first
        existing_id = self.check_duplicate(lead)
        if existing_id:
            return {
                "status": "duplicate",
                "name": lead.get("name"),
                "existing_id": existing_id,
                "message": f"Lead '{lead['name']}' already exists in Bigin (ID: {existing_id})",
            }

        # Map lead fields to Bigin Contact fields
        # Split contact name into first/last if available
        contact_name = lead.get("contact_name", "")
        first_name = ""
        last_name = lead.get("name", "")  # Default: use business name as last name

        if contact_name:
            parts = contact_name.split()
            if len(parts) >= 2:
                first_name = parts[0]
                last_name = " ".join(parts[1:])
            else:
                last_name = contact_name

        payload = {
            "data": [
                {
                    # Standard Bigin Contact fields
                    "First_Name": first_name,
                    "Last_Name": last_name,
                    "Company_Name": lead.get("name", ""),
                    "Phone": lead.get("phone", ""),
                    "Email": lead.get("email", ""),
                    "Website": lead.get("website", ""),
                    "Mailing_Street": lead.get("address", ""),
                    "Title": lead.get("contact_title", ""),
                    "Description": (
                        f"Category: {lead.get('category', 'unknown')} | "
                        f"Lead Score: {lead.get('lead_score', 'N/A')} | "
                        f"Google Rating: {lead.get('rating', 'N/A')} "
                        f"({lead.get('total_ratings', 0)} reviews) | "
                        f"Source: SAIL Lead Generation"
                    ),
                    "Lead_Source": "SAIL Lead Gen",
                    # Custom boolean fields for enrichment tracking
                    # Note: These fields need to exist in Bigin first.
                    # If they don't exist, Bigin will ignore them silently.
                    "Enriched_Google": lead.get("enriched_google", False),
                    "Enriched_Hunter": lead.get("enriched_hunter", False),
                    "Enriched_Apollo": lead.get("enriched_apollo", False),
                    "Enriched_Pattern": lead.get("enriched_pattern", False),
                    "Enriched_Website_Scrape": lead.get("enriched_website_scrape", False),
                }
            ]
        }

        if dry_run:
            return {
                "status": "dry_run",
                "name": lead.get("name"),
                "payload": payload["data"][0],
                "message": f"Would create contact for '{lead['name']}'",
            }

        # Actually create the record in Bigin
        try:
            response = requests.post(
                f"{self.base_url}/Contacts",
                headers=self.headers,
                json=payload,
                timeout=15,
            )
            response.raise_for_status()
            data = response.json()

            result = data.get("data", [{}])[0]
            if result.get("code") == "SUCCESS":
                record_id = result.get("details", {}).get("id")
                logger.info(f"Created contact: {lead['name']} (ID: {record_id})")

                # Add to cache so we don't create duplicates in the same run
                normalized = lead.get("name", "").strip().lower()
                self._existing_contacts[normalized] = record_id

                return {
                    "status": "created",
                    "name": lead.get("name"),
                    "record_id": record_id,
                    "message": f"Successfully created contact for '{lead['name']}'",
                }
            else:
                error_msg = result.get("message", "Unknown error")
                logger.error(f"Bigin creation failed for '{lead['name']}': {error_msg}")
                return {
                    "status": "error",
                    "name": lead.get("name"),
                    "message": error_msg,
                }

        except requests.RequestException as e:
            logger.error(f"API request failed creating '{lead['name']}': {e}")
            return {
                "status": "error",
                "name": lead.get("name"),
                "message": str(e),
            }

    def bulk_create_contacts(self, leads, dry_run=False, delay=0.5):
        """
        Create multiple contacts in Bigin from a list of leads.

        Args:
            leads: List of lead dicts.
            dry_run: If True, simulate without writing.
            delay: Seconds between API calls (rate limiting).

        Returns:
            Summary dict with counts and detailed results.
        """
        results = {
            "created": [],
            "duplicates": [],
            "errors": [],
            "dry_runs": [],
            "total": len(leads),
        }

        for i, lead in enumerate(leads):
            result = self.create_contact(lead, dry_run=dry_run)
            status = result["status"]

            if status == "created":
                results["created"].append(result)
            elif status == "duplicate":
                results["duplicates"].append(result)
            elif status == "error":
                results["errors"].append(result)
            elif status == "dry_run":
                results["dry_runs"].append(result)

            # Progress log every 10 records
            if (i + 1) % 10 == 0:
                logger.info(f"  CRM progress: {i+1}/{len(leads)} processed")

            if not dry_run:
                time.sleep(delay)

        # Summary
        logger.info(
            f"\nBigin CRM Summary:\n"
            f"  Total leads processed: {results['total']}\n"
            f"  Created: {len(results['created'])}\n"
            f"  Duplicates skipped: {len(results['duplicates'])}\n"
            f"  Errors: {len(results['errors'])}\n"
            f"  Dry run: {len(results['dry_runs'])}"
        )

        return results
