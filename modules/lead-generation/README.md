# Lead Generation Module

Discovers potential clients for SA Picture Day by searching the internet for dance studios, schools, daycares, and sports organizations in a target area.

## What It Does

1. **Searches** Google Places API for businesses matching target categories
2. **Enriches** results with phone numbers, websites, and contact details
3. **Filters** out closed or low-quality businesses
4. **Scores** leads by prospect quality (website presence, reviews, category priority)
5. **Finds emails** via website scraping, Hunter.io, Apollo.io, and email pattern inference
6. **Outputs** results as CSV (dry run) or creates records in Zoho Bigin CRM

## Setup

### 1. Install Dependencies

```bash
cd sail-crm-engine
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

**Required:**
- `GOOGLE_PLACES_API_KEY` - Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials). Enable "Places API".

**Optional (for email enrichment):**
- `HUNTER_API_KEY` - [hunter.io](https://hunter.io) (free: 25 searches/month)
- `APOLLO_API_KEY` - [apollo.io](https://apollo.io) (free: 10,000 records/month)

**Required for live mode:**
- `ZOHO_API_TOKEN` - Get from Zoho developer console or MCP server

### 3. Zoho Bigin Custom Fields

For full enrichment tracking, create these boolean (checkbox) fields in Bigin Contacts:
- `Enriched_Google`
- `Enriched_Hunter`
- `Enriched_Apollo`
- `Enriched_Pattern`
- `Enriched_Website_Scrape`

These track which enrichment sources have been checked for each lead, preventing duplicate lookups.

## Usage

```bash
cd modules/lead-generation

# Dry run (default) - saves results to CSV, no CRM writes
python main.py

# Search a specific city
python main.py --location "Austin, TX"

# Only search for dance studios
python main.py --categories dance_studio

# Search multiple categories
python main.py --categories dance_studio,daycare

# Skip email enrichment (faster)
python main.py --skip-enrichment

# Skip Google details (saves API quota)
python main.py --skip-google-details

# Live mode - creates records in Zoho Bigin
python main.py --live

# Full options
python main.py --location "San Antonio, TX" --radius 50000 --max-results 60 --verbose
```

## Output

- **CSV file**: `output/leads_YYYY-MM-DD_HHMMSS.csv` - spreadsheet-ready
- **JSON file**: `output/leads_YYYY-MM-DD_HHMMSS.json` - full data for debugging
- **Log file**: `output/lead_gen.log` - detailed run log

## Lead Scoring

Each lead gets a quality score (0-100) based on:

| Factor | Points | Why |
|--------|--------|-----|
| Has website | +20 | Active online presence |
| Has phone | +10 | Contactable |
| Google rating (0-5) | up to +15 | Business quality |
| Review count | up to +15 | Established business |
| Category priority | up to +20 | Dance studios score highest |
| Business is open | +20 | Not closed |

## Email Enrichment Pipeline

Enrichment runs in order, stopping as soon as an email is found:

1. **Website scraping** (FREE) - Scrapes homepage, /contact, /about pages
2. **Hunter.io** (FREE tier: 25/month) - Domain-based email search
3. **Apollo.io** (FREE tier: 10k/month) - Company/contact search
4. **Email pattern inference** (FREE) - Common patterns + MX verification

## Architecture

```
modules/lead-generation/
├── main.py              # CLI entry point and pipeline orchestration
├── search_engine.py     # Google Places search + scoring
├── email_enrichment.py  # Multi-source email finding
└── README.md            # This file
```
