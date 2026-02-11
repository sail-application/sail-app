# Zoho Bigin CRM Integration

Python client for the Zoho Bigin CRM API. Handles authentication, record creation, duplicate checking, and field mapping for the SAIL lead generation pipeline.

## Features

- Create Contact records from lead data
- Duplicate detection by company name before creating
- Dry-run mode for testing without writing to CRM
- Bulk creation with rate limiting
- Boolean tracking fields for enrichment sources

## Setup

Set `ZOHO_API_TOKEN` in your `.env` file. Get the token from:
- Zoho Developer Console: https://accounts.zoho.com/developerconsole
- Or the Zoho MCP server provided for this project

## Usage

```python
from integrations.bigin.client import BiginClient

client = BiginClient(api_token="your-token")

# Test connection
if client.test_connection():
    # Create a single contact
    result = client.create_contact(lead_dict, dry_run=False)

    # Bulk create
    results = client.bulk_create_contacts(leads_list, dry_run=True)
```

## Custom Fields

The integration writes these boolean fields to track enrichment status:
- `Enriched_Google`, `Enriched_Hunter`, `Enriched_Apollo`, `Enriched_Pattern`, `Enriched_Website_Scrape`

Create these as checkbox fields in your Bigin Contacts module.
