# SAIL CRM Engine - Setup Guide

Step-by-step instructions for getting the SAIL lead generation engine running from scratch.

## Prerequisites

- Python 3.9+ installed
- pip (Python package manager)
- A Google Cloud account (for Places API)
- A Zoho Bigin account (for CRM integration)

## Step 1: Clone and Install

```bash
git clone <repo-url>
cd sail-crm-engine
pip install -r requirements.txt
```

## Step 2: Get API Keys

### Google Places API (Required)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable "Places API" under APIs & Services
4. Create an API key under Credentials
5. Copy the key

**Cost:** Google gives $200/month free credit. A typical lead search run (200 leads) uses about $5-10 of quota.

### Hunter.io (Optional - Free Tier)

1. Sign up at [hunter.io](https://hunter.io)
2. Go to API section in your dashboard
3. Copy your API key

**Free tier:** 25 email searches per month.

### Apollo.io (Optional - Free Tier)

1. Sign up at [apollo.io](https://www.apollo.io)
2. Go to Settings > Integrations > API
3. Copy your API key

**Free tier:** 10,000 records per month.

### Zoho Bigin (Required for live mode)

1. Log into [Zoho Developer Console](https://accounts.zoho.com/developerconsole)
2. Create a Server-based Client
3. Generate an OAuth token with scope: `ZohoBigin.modules.ALL`
4. Or use the Zoho MCP server URL provided by your admin

## Step 3: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and paste in your API keys:

```
GOOGLE_PLACES_API_KEY=your-key-here
HUNTER_API_KEY=your-key-here
APOLLO_API_KEY=your-key-here
ZOHO_API_TOKEN=your-token-here
```

## Step 4: Create Bigin Custom Fields

In your Zoho Bigin account, add these checkbox fields to the Contacts module:

- `Enriched_Google` - Tracks if Google Places data was collected
- `Enriched_Hunter` - Tracks if Hunter.io was checked
- `Enriched_Apollo` - Tracks if Apollo.io was checked
- `Enriched_Pattern` - Tracks if email pattern inference was tried
- `Enriched_Website_Scrape` - Tracks if the website was scraped for email

These prevent duplicate lookups when re-running enrichment on existing leads.

## Step 5: Run a Dry Run

```bash
cd modules/lead-generation
python main.py
```

This will:
1. Search Google Places for businesses in San Antonio, TX
2. Collect business details (name, address, phone, website)
3. Attempt to find email addresses
4. Save results to `output/leads_*.csv`
5. **NOT** write anything to Zoho Bigin

Check the CSV output to verify results look correct.

## Step 6: Go Live

Once you're satisfied with the dry run results:

```bash
python main.py --live
```

This will create Contact records in Zoho Bigin for each lead found.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Missing required environment variables" | Check your `.env` file has all required keys filled in |
| Google API returns 403 | Verify Places API is enabled in your Google Cloud project |
| Zoho returns 401 | Your OAuth token may have expired; regenerate it |
| No results found | Try increasing `--radius` or broadening `--categories` |
| Rate limit errors | Reduce `--max-results` or wait before re-running |
