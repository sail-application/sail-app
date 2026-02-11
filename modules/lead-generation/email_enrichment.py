# =============================================================================
# email_enrichment.py - Free-Tier Email Enrichment Pipeline
# =============================================================================
# Finds email addresses and contact info for leads using a multi-step
# approach that prioritizes free tiers before paid services.
#
# Enrichment order (each step only runs if previous steps didn't find an email):
#   1. Website scraping - FREE - Scrape the lead's website for emails/contacts
#   2. Hunter.io - FREE TIER (25/mo) - Domain-based email search
#   3. Apollo.io - FREE TIER (10k/mo) - Company/contact search
#   4. Email pattern inference - FREE - Guess common email patterns and verify
#
# Each lead gets boolean flags tracking which sources have been checked,
# so we never check the same lead twice with the same service.
# =============================================================================

import logging
import re
import time
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger("lead-generation.enrichment")

# Common email patterns used by small businesses.
# {first} = first name, {last} = last name, {domain} = company domain.
EMAIL_PATTERNS = [
    "{first}@{domain}",
    "{first}.{last}@{domain}",
    "{first}{last}@{domain}",
    "info@{domain}",
    "contact@{domain}",
    "hello@{domain}",
    "admin@{domain}",
    "office@{domain}",
    "studio@{domain}",       # Common for dance studios
    "frontdesk@{domain}",
    "director@{domain}",
]


class EmailEnrichmentPipeline:
    """
    Multi-source email enrichment that uses free tiers first.
    Tracks which sources have been checked per lead to avoid duplicate work.
    """

    def __init__(self, hunter_api_key="", apollo_api_key=""):
        """
        Args:
            hunter_api_key: Hunter.io API key (optional, skip if empty).
            apollo_api_key: Apollo.io API key (optional, skip if empty).
        """
        self.hunter_api_key = hunter_api_key
        self.apollo_api_key = apollo_api_key
        # Track API usage so we don't exceed free tiers
        self._hunter_calls = 0
        self._apollo_calls = 0

    def enrich_leads(self, leads, skip_already_enriched=True):
        """
        Run the full enrichment pipeline on a list of leads.
        Stops enriching each lead as soon as an email is found.

        Args:
            leads: List of lead dicts. Must have 'website' and enrichment flags.
            skip_already_enriched: If True, skip leads that already have an email.

        Returns:
            The same list with email, contact_name, and contact_title updated.
        """
        total = len(leads)
        found_count = 0

        for i, lead in enumerate(leads):
            # Skip leads that already have an email
            if skip_already_enriched and lead.get("email"):
                continue

            name = lead.get("name", "Unknown")

            # Step 1: Website scraping (always free)
            if lead.get("website") and not lead.get("enriched_website_scrape"):
                logger.debug(f"  [{i+1}/{total}] Scraping website for: {name}")
                self._scrape_website(lead)
                lead["enriched_website_scrape"] = True

                if lead.get("email"):
                    found_count += 1
                    logger.info(f"  Found email via website: {name} -> {lead['email']}")
                    continue

            # Step 2: Hunter.io (free tier: 25 searches/month)
            if (self.hunter_api_key
                    and not lead.get("enriched_hunter")
                    and lead.get("website")
                    and self._hunter_calls < 25):
                logger.debug(f"  [{i+1}/{total}] Hunter.io lookup for: {name}")
                self._hunter_search(lead)
                lead["enriched_hunter"] = True

                if lead.get("email"):
                    found_count += 1
                    logger.info(f"  Found email via Hunter.io: {name} -> {lead['email']}")
                    continue

            # Step 3: Apollo.io (free tier: generous limits)
            if (self.apollo_api_key
                    and not lead.get("enriched_apollo")):
                logger.debug(f"  [{i+1}/{total}] Apollo.io lookup for: {name}")
                self._apollo_search(lead)
                lead["enriched_apollo"] = True

                if lead.get("email"):
                    found_count += 1
                    logger.info(f"  Found email via Apollo.io: {name} -> {lead['email']}")
                    continue

            # Step 4: Email pattern inference + verification (free)
            if lead.get("website") and not lead.get("enriched_pattern"):
                logger.debug(f"  [{i+1}/{total}] Pattern inference for: {name}")
                self._infer_email_pattern(lead)
                lead["enriched_pattern"] = True

                if lead.get("email"):
                    found_count += 1
                    logger.info(f"  Found email via pattern: {name} -> {lead['email']}")
                    continue

            # Progress log
            if (i + 1) % 25 == 0:
                logger.info(f"  Enrichment progress: {i+1}/{total} processed, {found_count} emails found")

        logger.info(
            f"Enrichment complete. Found emails for {found_count}/{total} leads. "
            f"Hunter.io calls used: {self._hunter_calls}/25. "
            f"Apollo.io calls used: {self._apollo_calls}."
        )
        return leads

    def _scrape_website(self, lead):
        """
        Scrape the lead's website to find email addresses and contact names.
        Checks the homepage and common paths like /about, /contact.

        This is completely free and often the best source for small businesses
        who display their email and owner info prominently.
        """
        website = lead.get("website", "")
        if not website:
            return

        # Ensure URL has a scheme
        if not website.startswith(("http://", "https://")):
            website = "https://" + website

        # Pages to check (homepage + common contact pages)
        paths_to_try = ["", "/contact", "/about", "/contact-us", "/about-us"]
        base_url = website.rstrip("/")

        emails_found = set()
        contact_names = []

        for path in paths_to_try:
            url = base_url + path
            try:
                response = requests.get(
                    url,
                    timeout=10,
                    headers={"User-Agent": "SAIL-LeadGen/1.0 (lead research tool)"},
                    allow_redirects=True,
                )
                if response.status_code != 200:
                    continue

                html = response.text
                soup = BeautifulSoup(html, "html.parser")

                # Extract emails from the page text and mailto links
                page_text = soup.get_text()
                found = re.findall(
                    r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
                    page_text
                )
                emails_found.update(found)

                # Check mailto: links specifically
                for link in soup.find_all("a", href=True):
                    href = link.get("href", "")
                    if href.startswith("mailto:"):
                        email = href.replace("mailto:", "").split("?")[0].strip()
                        if email:
                            emails_found.add(email)

                # Try to find owner/contact name from common patterns
                # Look for "Owner", "Director", "Principal", "Founder" near names
                for tag in soup.find_all(["p", "span", "div", "h2", "h3", "h4", "li"]):
                    text = tag.get_text(strip=True)
                    # Match patterns like "Owner: Jane Smith" or "Jane Smith, Owner"
                    match = re.search(
                        r"(?:owner|director|principal|founder|manager|proprietor)"
                        r"[:\s,–-]+([A-Z][a-z]+ [A-Z][a-z]+)",
                        text,
                        re.IGNORECASE
                    )
                    if match:
                        contact_names.append(match.group(1))

                    match2 = re.search(
                        r"([A-Z][a-z]+ [A-Z][a-z]+)"
                        r"[,\s–-]+(?:owner|director|principal|founder|manager)",
                        text,
                        re.IGNORECASE
                    )
                    if match2:
                        contact_names.append(match2.group(1))

            except requests.RequestException:
                continue  # Page didn't load, try next path

            time.sleep(0.5)  # Polite delay between page requests

        # Filter out generic/spam emails and pick the best one
        good_emails = self._filter_emails(emails_found, website)
        if good_emails:
            lead["email"] = good_emails[0]  # Best email
        if contact_names:
            lead["contact_name"] = contact_names[0]

    def _filter_emails(self, emails, website):
        """
        Filter and rank found emails. Prefer business-domain emails over
        generic ones (gmail, yahoo, etc.), and personal ones over info@.
        """
        if not emails:
            return []

        # Extract domain from website for matching
        parsed = urlparse(website if "://" in website else f"https://{website}")
        business_domain = parsed.netloc.replace("www.", "")

        business_emails = []
        personal_emails = []
        generic_emails = []

        # Emails to ignore (common false positives from scraped pages)
        ignore_patterns = [
            "wix.com", "wordpress.com", "squarespace.com", "godaddy.com",
            "example.com", "email.com", "sentry.io", "googleapis.com",
        ]

        for email in emails:
            email = email.lower().strip()

            # Skip obviously fake or system emails
            if any(p in email for p in ignore_patterns):
                continue
            if len(email) < 5:
                continue

            domain = email.split("@")[-1]

            # Categorize
            if domain == business_domain or domain == "www." + business_domain:
                # Email on the business's own domain — best kind
                local_part = email.split("@")[0]
                if local_part in ("info", "contact", "hello", "admin", "office", "support"):
                    generic_emails.append(email)
                else:
                    business_emails.append(email)
            elif domain in ("gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com"):
                personal_emails.append(email)

        # Return in priority order: business personal > business generic > personal
        return business_emails + generic_emails + personal_emails

    def _hunter_search(self, lead):
        """
        Search Hunter.io for emails associated with the lead's website domain.

        Hunter.io free tier: 25 searches/month, 10 verifications/month.
        We use the domain-search endpoint which returns all emails found
        for a given domain.
        """
        website = lead.get("website", "")
        if not website or not self.hunter_api_key:
            return

        # Extract domain from website URL
        parsed = urlparse(website if "://" in website else f"https://{website}")
        domain = parsed.netloc.replace("www.", "")

        if not domain:
            return

        try:
            response = requests.get(
                "https://api.hunter.io/v2/domain-search",
                params={
                    "domain": domain,
                    "api_key": self.hunter_api_key,
                },
                timeout=15,
            )
            self._hunter_calls += 1
            response.raise_for_status()
            data = response.json()

            emails = data.get("data", {}).get("emails", [])
            if emails:
                # Pick the email with highest confidence score
                best = max(emails, key=lambda e: e.get("confidence", 0))
                lead["email"] = best.get("value", "")
                first = best.get("first_name", "")
                last = best.get("last_name", "")
                if first or last:
                    lead["contact_name"] = f"{first} {last}".strip()
                if best.get("position"):
                    lead["contact_title"] = best["position"]

            # Also grab the org-level pattern for later inference
            pattern = data.get("data", {}).get("pattern")
            if pattern:
                lead["_email_pattern"] = pattern

        except requests.RequestException as e:
            logger.warning(f"  Hunter.io request failed for {domain}: {e}")

        time.sleep(1)  # Rate limit courtesy

    def _apollo_search(self, lead):
        """
        Search Apollo.io for company and contact information.

        Apollo.io free tier is generous (~10,000 records/month).
        We search by company name and location to find contacts.
        """
        if not self.apollo_api_key:
            return

        name = lead.get("name", "")
        if not name:
            return

        try:
            # Apollo's organization search
            response = requests.post(
                "https://api.apollo.io/v1/mixed_companies/search",
                headers={
                    "Content-Type": "application/json",
                    "Cache-Control": "no-cache",
                },
                json={
                    "api_key": self.apollo_api_key,
                    "q_organization_name": name,
                    "organization_locations": ["San Antonio, Texas, United States"],
                    "page": 1,
                    "per_page": 1,
                },
                timeout=15,
            )
            self._apollo_calls += 1
            response.raise_for_status()
            data = response.json()

            orgs = data.get("organizations", [])
            if orgs:
                org = orgs[0]
                if not lead.get("website") and org.get("website_url"):
                    lead["website"] = org["website_url"]
                if not lead.get("phone") and org.get("phone"):
                    lead["phone"] = org["phone"]

            # Search for people at this company
            if orgs:
                org_id = orgs[0].get("id")
                if org_id:
                    self._apollo_people_search(lead, org_id)

        except requests.RequestException as e:
            logger.warning(f"  Apollo.io request failed for '{name}': {e}")

        time.sleep(0.5)

    def _apollo_people_search(self, lead, organization_id):
        """Search Apollo for people at a specific organization."""
        try:
            response = requests.post(
                "https://api.apollo.io/v1/mixed_people/search",
                headers={
                    "Content-Type": "application/json",
                    "Cache-Control": "no-cache",
                },
                json={
                    "api_key": self.apollo_api_key,
                    "organization_ids": [organization_id],
                    "person_titles": ["owner", "director", "principal", "manager", "founder"],
                    "page": 1,
                    "per_page": 1,
                },
                timeout=15,
            )
            self._apollo_calls += 1
            response.raise_for_status()
            data = response.json()

            people = data.get("people", [])
            if people:
                person = people[0]
                if person.get("email"):
                    lead["email"] = person["email"]
                name_parts = [person.get("first_name", ""), person.get("last_name", "")]
                full_name = " ".join(p for p in name_parts if p).strip()
                if full_name:
                    lead["contact_name"] = full_name
                if person.get("title"):
                    lead["contact_title"] = person["title"]

        except requests.RequestException as e:
            logger.warning(f"  Apollo people search failed: {e}")

    def _infer_email_pattern(self, lead):
        """
        Guess the most likely email address using common patterns, then
        verify the domain accepts email (MX record check).

        This is the fallback strategy when API-based enrichment didn't work.
        We try common patterns like info@domain.com, contact@domain.com.
        Without a contact name, we can only try generic addresses.

        For verification, we check if the domain has MX records (meaning
        it can receive email). We do NOT send any emails — just check DNS.
        """
        website = lead.get("website", "")
        if not website:
            return

        parsed = urlparse(website if "://" in website else f"https://{website}")
        domain = parsed.netloc.replace("www.", "")

        if not domain:
            return

        # Check if domain has MX records (can receive email)
        if not self._domain_has_mx(domain):
            logger.debug(f"  Domain {domain} has no MX records, skipping pattern inference")
            return

        # Build candidate emails
        candidates = []
        contact_name = lead.get("contact_name", "")

        if contact_name:
            # If we have a contact name, try personalized patterns
            parts = contact_name.lower().split()
            if len(parts) >= 2:
                first = parts[0]
                last = parts[-1]
                candidates.extend([
                    f"{first}@{domain}",
                    f"{first}.{last}@{domain}",
                    f"{first[0]}{last}@{domain}",
                    f"{first}{last[0]}@{domain}",
                    f"{first}_{last}@{domain}",
                ])

        # Always try generic patterns
        candidates.extend([
            f"info@{domain}",
            f"contact@{domain}",
            f"hello@{domain}",
            f"office@{domain}",
            f"studio@{domain}",
            f"admin@{domain}",
        ])

        # Try to verify each candidate using SMTP-level check
        # For now, just use the most common generic pattern since we can't
        # do full SMTP verification without a mail server
        # The MX check above already confirms the domain accepts email
        lead["email"] = candidates[0]  # Best guess
        lead["email_confidence"] = "inferred"

    def _domain_has_mx(self, domain):
        """
        Check if a domain has MX records (meaning it can receive email).
        Uses a DNS lookup. Returns True if MX records exist.
        """
        import subprocess
        try:
            result = subprocess.run(
                ["nslookup", "-type=mx", domain],
                capture_output=True,
                text=True,
                timeout=5,
            )
            # If we find "mail exchanger" in the output, MX records exist
            return "mail exchanger" in result.stdout.lower() or "mx" in result.stdout.lower()
        except (subprocess.SubprocessError, FileNotFoundError):
            # If nslookup isn't available, assume the domain can receive email
            return True

    def get_usage_report(self):
        """Return a summary of API usage during this session."""
        return {
            "hunter_io_calls": self._hunter_calls,
            "hunter_io_limit": 25,
            "hunter_io_remaining": max(0, 25 - self._hunter_calls),
            "apollo_io_calls": self._apollo_calls,
        }
