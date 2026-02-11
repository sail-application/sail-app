# =============================================================================
# search_engine.py - Business Search Engine for Lead Generation
# =============================================================================
# Searches for potential photography clients (dance studios, schools, daycares,
# sports orgs) using Google Places API. Collects business name, address, phone,
# website, and any available contact info.
#
# The Google Places API is the primary search source because:
#   - It has the most complete business listing data
#   - Free tier provides $200/month credit (~5,000+ searches)
#   - Returns structured data (name, address, phone, website, ratings)
#   - Supports text search and nearby search with category filtering
#
# Usage:
#   from modules.lead_generation.search_engine import LeadSearchEngine
#   engine = LeadSearchEngine(api_key="your-key")
#   leads = engine.search_all(location="San Antonio, TX")
# =============================================================================

import logging
import time
import requests

logger = logging.getLogger("lead-generation.search")

# Business categories to search for, ordered by priority for SA Picture Day.
# Each tuple is (search_query, category_tag) so we can tag where each lead came from.
DEFAULT_SEARCH_QUERIES = [
    ("dance studio", "dance_studio"),
    ("dance academy", "dance_studio"),
    ("ballet school", "dance_studio"),
    ("daycare center", "daycare"),
    ("child care center", "daycare"),
    ("preschool", "daycare"),
    ("private school", "school"),
    ("elementary school", "school"),
    ("christian school", "school"),
    ("montessori school", "school"),
    ("youth sports league", "sports"),
    ("gymnastics center", "sports"),
    ("cheerleading gym", "sports"),
    ("martial arts school", "sports"),
    ("swim school", "sports"),
    ("youth soccer league", "sports"),
    ("little league baseball", "sports"),
]


class LeadSearchEngine:
    """
    Searches Google Places API for businesses matching SA Picture Day's
    target market. Handles pagination, deduplication, and rate limiting.
    """

    # Google Places API endpoints
    TEXTSEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"

    def __init__(self, api_key, location="San Antonio, TX", radius=40000):
        """
        Args:
            api_key: Google Places API key.
            location: City/state to search in (appended to each query).
            radius: Search radius in meters (default 40000 = ~25 miles).
        """
        self.api_key = api_key
        self.location = location
        self.radius = radius
        # Track place_ids we've already seen to avoid duplicates across queries
        self._seen_place_ids = set()

    def search_all(self, queries=None, max_results_per_query=60):
        """
        Run all search queries and return combined, deduplicated results.

        Args:
            queries: List of (query_string, category_tag) tuples.
                     Defaults to DEFAULT_SEARCH_QUERIES.
            max_results_per_query: Max results to fetch per query (Google
                                   returns up to 60 per text search with
                                   pagination, 20 per page).

        Returns:
            List of lead dicts with keys: name, address, phone, website,
            place_id, category, rating, total_ratings, lat, lng.
        """
        if queries is None:
            queries = DEFAULT_SEARCH_QUERIES

        all_leads = []

        for query_text, category in queries:
            logger.info(f"Searching for: '{query_text}' in {self.location}")
            leads = self._text_search(query_text, category, max_results_per_query)
            all_leads.extend(leads)
            logger.info(f"  Found {len(leads)} new results (total so far: {len(all_leads)})")

            # Small delay between queries to be respectful of rate limits
            time.sleep(0.5)

        logger.info(f"Search complete. Total unique leads found: {len(all_leads)}")
        return all_leads

    def _text_search(self, query, category, max_results):
        """
        Perform a Google Places text search and handle pagination.

        Google returns 20 results per page, up to 3 pages (60 results).
        Each page requires a next_page_token and a short delay.
        """
        leads = []
        full_query = f"{query} in {self.location}"

        params = {
            "query": full_query,
            "radius": self.radius,
            "key": self.api_key,
        }

        page_count = 0
        while True:
            try:
                response = requests.get(self.TEXTSEARCH_URL, params=params, timeout=15)
                response.raise_for_status()
                data = response.json()
            except requests.RequestException as e:
                logger.error(f"API request failed for '{query}': {e}")
                break

            status = data.get("status", "UNKNOWN")
            if status == "ZERO_RESULTS":
                logger.info(f"  No results for '{query}'")
                break
            elif status not in ("OK",):
                logger.error(f"  Google Places API error: {status} - {data.get('error_message', '')}")
                break

            # Process each result on this page
            for place in data.get("results", []):
                place_id = place.get("place_id", "")

                # Skip if we've already seen this business from another query
                if place_id in self._seen_place_ids:
                    continue
                self._seen_place_ids.add(place_id)

                lead = {
                    "name": place.get("name", ""),
                    "address": place.get("formatted_address", ""),
                    "phone": "",  # Not in text search results, need details call
                    "website": "",  # Not in text search results, need details call
                    "place_id": place_id,
                    "category": category,
                    "rating": place.get("rating", ""),
                    "total_ratings": place.get("user_ratings_total", 0),
                    "lat": place.get("geometry", {}).get("location", {}).get("lat", ""),
                    "lng": place.get("geometry", {}).get("location", {}).get("lng", ""),
                    "business_status": place.get("business_status", ""),
                    # Enrichment tracking flags (for Bigin boolean fields)
                    "enriched_google": True,
                    "enriched_hunter": False,
                    "enriched_apollo": False,
                    "enriched_pattern": False,
                    "email": "",
                    "contact_name": "",
                    "contact_title": "",
                }
                leads.append(lead)

            # Check if there are more pages
            next_token = data.get("next_page_token")
            page_count += 1

            if not next_token or len(leads) >= max_results:
                break

            # Google requires a short delay before using next_page_token
            time.sleep(2)
            params = {
                "pagetoken": next_token,
                "key": self.api_key,
            }

        return leads

    def enrich_with_details(self, leads, delay=0.3):
        """
        Call Google Places Details API for each lead to get phone and website.

        This uses additional API quota. The free tier gives $200/month which
        is about 5,000 text searches or 10,000 detail requests.

        Args:
            leads: List of lead dicts (must have 'place_id').
            delay: Seconds to wait between detail requests (rate limiting).

        Returns:
            The same list of leads, now with phone and website filled in.
        """
        logger.info(f"Enriching {len(leads)} leads with Google Places details...")
        enriched_count = 0

        for i, lead in enumerate(leads):
            place_id = lead.get("place_id")
            if not place_id:
                continue

            try:
                params = {
                    "place_id": place_id,
                    "fields": "formatted_phone_number,international_phone_number,website,url,opening_hours",
                    "key": self.api_key,
                }
                response = requests.get(self.DETAILS_URL, params=params, timeout=15)
                response.raise_for_status()
                data = response.json()

                if data.get("status") == "OK":
                    result = data.get("result", {})
                    lead["phone"] = result.get("formatted_phone_number", "")
                    lead["website"] = result.get("website", "")
                    lead["google_maps_url"] = result.get("url", "")
                    enriched_count += 1

            except requests.RequestException as e:
                logger.warning(f"  Details request failed for '{lead['name']}': {e}")

            # Progress log every 25 leads
            if (i + 1) % 25 == 0:
                logger.info(f"  Progress: {i + 1}/{len(leads)} leads enriched")

            time.sleep(delay)

        logger.info(f"Details enrichment complete. {enriched_count}/{len(leads)} leads updated.")
        return leads

    def filter_active_businesses(self, leads):
        """
        Remove leads that are permanently closed or have very low ratings.

        A business that's closed isn't a prospect. Very low ratings (below 2.0)
        may indicate the business is struggling and not a good lead.
        """
        filtered = []
        removed_count = 0

        for lead in leads:
            # Skip permanently closed businesses
            if lead.get("business_status") == "CLOSED_PERMANENTLY":
                logger.debug(f"  Removed (closed): {lead['name']}")
                removed_count += 1
                continue

            # Skip businesses with very low ratings (if they have enough reviews)
            rating = lead.get("rating", 0)
            total_ratings = lead.get("total_ratings", 0)
            if rating and total_ratings >= 5 and rating < 2.0:
                logger.debug(f"  Removed (low rating {rating}): {lead['name']}")
                removed_count += 1
                continue

            filtered.append(lead)

        if removed_count:
            logger.info(f"Filtered out {removed_count} closed/low-rated businesses.")

        return filtered

    def score_leads(self, leads):
        """
        Assign a quality score to each lead based on how likely they are to
        be a good prospect for volume photography.

        Scoring factors:
        - Has a website (strong signal of active business): +20 points
        - Has a phone number: +10 points
        - Higher Google rating: up to +15 points
        - More reviews (indicates established business): up to +15 points
        - Category priority (dance > daycare > school > sports): up to +20 points
        - Business is operational: +20 points

        Returns:
            Same list with 'lead_score' field added, sorted by score descending.
        """
        category_scores = {
            "dance_studio": 20,  # Highest priority per CLAUDE.md
            "daycare": 15,
            "school": 12,
            "sports": 10,
        }

        for lead in leads:
            score = 0

            # Website present
            if lead.get("website"):
                score += 20

            # Phone present
            if lead.get("phone"):
                score += 10

            # Google rating (0-5 scale, map to 0-15 points)
            rating = lead.get("rating")
            if rating:
                score += min(15, int(float(rating) * 3))

            # Number of reviews (more = more established)
            total_ratings = lead.get("total_ratings", 0)
            if total_ratings >= 100:
                score += 15
            elif total_ratings >= 50:
                score += 12
            elif total_ratings >= 20:
                score += 8
            elif total_ratings >= 5:
                score += 4

            # Category priority
            category = lead.get("category", "")
            score += category_scores.get(category, 5)

            # Active business bonus
            status = lead.get("business_status", "")
            if status == "OPERATIONAL" or not status:
                score += 20

            lead["lead_score"] = score

        # Sort by score, highest first
        leads.sort(key=lambda x: x.get("lead_score", 0), reverse=True)
        return leads
