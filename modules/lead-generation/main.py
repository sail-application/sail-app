#!/usr/bin/env python3
# =============================================================================
# main.py - SAIL Lead Generation Tool
# =============================================================================
# Discovers potential clients for SA Picture Day (volume photography business)
# by searching the internet for dance studios, schools, daycares, and sports
# organizations in the San Antonio, TX area.
#
# The tool follows this pipeline:
#   1. SEARCH - Find businesses using Google Places API
#   2. ENRICH (Google) - Get phone, website, details from Google
#   3. FILTER - Remove closed/low-quality businesses
#   4. SCORE - Rank leads by quality
#   5. ENRICH (Email) - Find emails via website scraping, Hunter.io, Apollo.io
#   6. OUTPUT - Save to CSV (dry run) or create in Zoho Bigin CRM
#
# Usage:
#   # Dry run (default) - outputs CSV, no CRM writes
#   python main.py
#
#   # Dry run with custom location
#   python main.py --location "Austin, TX"
#
#   # Live run - creates records in Zoho Bigin
#   python main.py --live
#
#   # Skip email enrichment (faster, just get basic business info)
#   python main.py --skip-enrichment
#
#   # Only search specific categories
#   python main.py --categories dance_studio,daycare
# =============================================================================

import argparse
import json
import logging
import os
import sys

# Add project root to Python path so we can import shared modules.
# This is needed because Python doesn't automatically look up the tree.
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, PROJECT_ROOT)

from shared.config.settings import get_config  # noqa: E402
from shared.utils.helpers import (  # noqa: E402
    setup_logger,
    write_leads_to_csv,
    generate_output_filename,
    deduplicate_leads,
    format_phone,
)
from modules.lead_generation.search_engine import LeadSearchEngine, DEFAULT_SEARCH_QUERIES  # noqa: E402
from modules.lead_generation.email_enrichment import EmailEnrichmentPipeline  # noqa: E402
from integrations.bigin.client import BiginClient  # noqa: E402


def parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="SAIL Lead Generation - Find prospects for SA Picture Day",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py                              # Dry run, CSV output
  python main.py --location "Austin, TX"      # Search different city
  python main.py --live                       # Write to Zoho Bigin CRM
  python main.py --skip-enrichment            # Skip email finding
  python main.py --categories dance_studio    # Only dance studios
        """,
    )
    parser.add_argument(
        "--live",
        action="store_true",
        default=False,
        help="Live mode: actually create records in Zoho Bigin. Default is dry run.",
    )
    parser.add_argument(
        "--location",
        type=str,
        default=None,
        help="City/state to search (default: from .env or 'San Antonio, TX').",
    )
    parser.add_argument(
        "--radius",
        type=int,
        default=None,
        help="Search radius in meters (default: 40000 = ~25 miles).",
    )
    parser.add_argument(
        "--categories",
        type=str,
        default=None,
        help="Comma-separated categories to search: dance_studio,daycare,school,sports",
    )
    parser.add_argument(
        "--skip-enrichment",
        action="store_true",
        default=False,
        help="Skip email enrichment (faster, just collect business info).",
    )
    parser.add_argument(
        "--skip-google-details",
        action="store_true",
        default=False,
        help="Skip Google Places detail lookups (saves API quota).",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Custom output CSV file path.",
    )
    parser.add_argument(
        "--max-results",
        type=int,
        default=60,
        help="Max results per search query (default: 60).",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        default=False,
        help="Enable debug-level logging.",
    )
    return parser.parse_args()


def filter_queries_by_category(categories_str):
    """
    Filter the default search queries to only include specified categories.

    Args:
        categories_str: Comma-separated category names (e.g., "dance_studio,daycare").

    Returns:
        Filtered list of (query, category) tuples.
    """
    categories = [c.strip() for c in categories_str.split(",")]
    filtered = [(q, cat) for q, cat in DEFAULT_SEARCH_QUERIES if cat in categories]

    if not filtered:
        print(f"\n[ERROR] No valid categories found in: {categories_str}")
        print("Valid categories: dance_studio, daycare, school, sports")
        sys.exit(1)

    return filtered


def print_summary(leads, crm_results=None, enrichment_report=None, dry_run=True):
    """Print a formatted summary of the lead generation run."""
    print("\n" + "=" * 70)
    print("  SAIL Lead Generation - Run Summary")
    print("=" * 70)

    mode = "DRY RUN (no CRM writes)" if dry_run else "LIVE (records created in Bigin)"
    print(f"\n  Mode: {mode}")
    print(f"  Total leads found: {len(leads)}")

    if leads:
        # Category breakdown
        categories = {}
        for lead in leads:
            cat = lead.get("category", "unknown")
            categories[cat] = categories.get(cat, 0) + 1

        print("\n  Leads by category:")
        for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
            print(f"    {cat}: {count}")

        # Email stats
        with_email = sum(1 for ld in leads if ld.get("email"))
        with_phone = sum(1 for ld in leads if ld.get("phone"))
        with_website = sum(1 for ld in leads if ld.get("website"))
        with_contact = sum(1 for ld in leads if ld.get("contact_name"))

        print("\n  Data completeness:")
        print(f"    With email:   {with_email}/{len(leads)} ({_pct(with_email, len(leads))})")
        print(f"    With phone:   {with_phone}/{len(leads)} ({_pct(with_phone, len(leads))})")
        print(f"    With website: {with_website}/{len(leads)} ({_pct(with_website, len(leads))})")
        print(f"    With contact: {with_contact}/{len(leads)} ({_pct(with_contact, len(leads))})")

        # Top 10 leads by score
        scored = [ld for ld in leads if ld.get("lead_score")]
        if scored:
            print("\n  Top 10 leads by score:")
            for lead in scored[:10]:
                email_flag = "✓" if lead.get("email") else "✗"
                print(
                    f"    [{lead.get('lead_score', 0):3d}] {lead['name'][:40]:<40} "
                    f"email:{email_flag}  {lead.get('category', '')}"
                )

    if enrichment_report:
        print("\n  Enrichment API usage:")
        print(f"    Hunter.io: {enrichment_report['hunter_io_calls']}/{enrichment_report['hunter_io_limit']} calls")
        print(f"    Apollo.io: {enrichment_report['apollo_io_calls']} calls")

    if crm_results:
        print("\n  CRM results:")
        print(f"    Created:    {len(crm_results.get('created', []))}")
        print(f"    Duplicates: {len(crm_results.get('duplicates', []))}")
        print(f"    Errors:     {len(crm_results.get('errors', []))}")

    print("\n" + "=" * 70)


def _pct(part, total):
    """Calculate percentage string."""
    if total == 0:
        return "0%"
    return f"{(part / total) * 100:.0f}%"


def main():
    """Main entry point for the lead generation tool."""
    args = parse_args()

    # Set up logging
    log_level = logging.DEBUG if args.verbose else logging.INFO
    setup_logger(
        "lead-generation",
        log_file=os.path.join(PROJECT_ROOT, "output", "lead_gen.log"),
        level=log_level,
    )
    # Also configure child loggers
    setup_logger("lead-generation.search", level=log_level)
    setup_logger("lead-generation.enrichment", level=log_level)
    setup_logger("bigin.client", level=log_level)

    print("\n" + "=" * 70)
    print("  SAIL Lead Generation Tool")
    print("  Finding prospects for SA Picture Day")
    print("=" * 70)

    # --- Load Configuration ---
    # For dry run, we only need Google Places API key.
    # For live mode, we also need Zoho API token.
    if args.live:
        required = ["GOOGLE_PLACES_API_KEY", "ZOHO_API_TOKEN"]
    else:
        required = ["GOOGLE_PLACES_API_KEY"]

    config = get_config(required_keys=required)

    location = args.location or config["DEFAULT_SEARCH_LOCATION"]
    radius = args.radius or config["DEFAULT_SEARCH_RADIUS"]

    print(f"\n  Location: {location}")
    print(f"  Radius: {radius}m (~{radius // 1609} miles)")
    print(f"  Mode: {'LIVE' if args.live else 'DRY RUN'}")

    # --- Step 1: Search for Businesses ---
    print("\n--- Step 1: Searching for businesses ---")
    search_engine = LeadSearchEngine(
        api_key=config["GOOGLE_PLACES_API_KEY"],
        location=location,
        radius=radius,
    )

    # Filter queries if specific categories requested
    queries = None
    if args.categories:
        queries = filter_queries_by_category(args.categories)
        print(f"  Searching categories: {args.categories}")

    leads = search_engine.search_all(queries=queries, max_results_per_query=args.max_results)

    if not leads:
        print("\n[WARNING] No leads found. Check your API key and search parameters.")
        sys.exit(0)

    # --- Step 2: Enrich with Google Details ---
    if not args.skip_google_details:
        print("\n--- Step 2: Getting business details from Google ---")
        leads = search_engine.enrich_with_details(leads)
    else:
        print("\n--- Step 2: Skipped Google details enrichment ---")

    # --- Step 3: Filter and Deduplicate ---
    print("\n--- Step 3: Filtering and deduplicating ---")
    leads = search_engine.filter_active_businesses(leads)
    leads = deduplicate_leads(leads, key_field="name")
    print(f"  {len(leads)} leads after filtering")

    # Format phone numbers
    for lead in leads:
        lead["phone"] = format_phone(lead.get("phone", ""))

    # --- Step 4: Score Leads ---
    print("\n--- Step 4: Scoring leads ---")
    leads = search_engine.score_leads(leads)
    print(f"  Score range: {leads[-1].get('lead_score', 0)} - {leads[0].get('lead_score', 0)}")

    # --- Step 5: Email Enrichment ---
    enrichment_report = None
    if not args.skip_enrichment:
        print("\n--- Step 5: Finding email addresses ---")
        enrichment = EmailEnrichmentPipeline(
            hunter_api_key=config.get("HUNTER_API_KEY", ""),
            apollo_api_key=config.get("APOLLO_API_KEY", ""),
        )
        leads = enrichment.enrich_leads(leads)
        enrichment_report = enrichment.get_usage_report()
    else:
        print("\n--- Step 5: Skipped email enrichment ---")

    # --- Step 6: Output Results ---
    print("\n--- Step 6: Saving results ---")

    # Always save to CSV regardless of mode
    output_dir = os.path.join(PROJECT_ROOT, "output")
    os.makedirs(output_dir, exist_ok=True)

    csv_filename = args.output or os.path.join(
        output_dir,
        generate_output_filename("leads")
    )

    # Define CSV columns in a sensible order
    csv_fields = [
        "lead_score", "name", "category", "address", "phone", "email",
        "website", "contact_name", "contact_title", "rating", "total_ratings",
        "business_status", "google_maps_url", "email_confidence",
        "enriched_google", "enriched_hunter", "enriched_apollo",
        "enriched_pattern", "enriched_website_scrape",
    ]

    csv_path = write_leads_to_csv(leads, csv_filename, fieldnames=csv_fields)
    if csv_path:
        print(f"  CSV saved: {csv_path}")

    # --- Step 7: CRM Integration ---
    crm_results = None
    if args.live:
        print("\n--- Step 7: Creating records in Zoho Bigin ---")
        bigin = BiginClient(
            api_token=config["ZOHO_API_TOKEN"],
            base_url=config["ZOHO_BIGIN_BASE_URL"],
        )

        # Test connection first
        if not bigin.test_connection():
            print("\n[ERROR] Cannot connect to Zoho Bigin. Check your ZOHO_API_TOKEN.")
            print("  Results have been saved to CSV. Fix the token and try --live again.")
            print_summary(leads, enrichment_report=enrichment_report, dry_run=True)
            sys.exit(1)

        crm_results = bigin.bulk_create_contacts(leads, dry_run=False)
    else:
        # Dry run: simulate CRM creation
        print("\n--- Step 7: DRY RUN - Simulating CRM creation ---")
        bigin = BiginClient(api_token="dry-run-token")
        crm_results = bigin.bulk_create_contacts(leads, dry_run=True)

    # --- Final Summary ---
    print_summary(
        leads,
        crm_results=crm_results,
        enrichment_report=enrichment_report,
        dry_run=not args.live,
    )

    # Save full results as JSON for debugging/reference
    json_path = csv_filename.replace(".csv", ".json")
    with open(json_path, "w", encoding="utf-8") as f:
        # Remove internal fields before saving
        clean_leads = []
        for lead in leads:
            clean = {k: v for k, v in lead.items() if not k.startswith("_")}
            clean_leads.append(clean)
        json.dump(clean_leads, f, indent=2, default=str)
    print(f"\n  Full results (JSON): {json_path}")

    print("\nDone! 🎯")


if __name__ == "__main__":
    main()
