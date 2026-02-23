# Google Maps Wrapper Actor (Crawlee + Apify)

This Actor runs Apify's official **Google Maps Scraper** (`apify/google-maps-scraper`), fetches its dataset output, normalizes fields, deduplicates by `maps_url`, and writes final JSON records to the Actor dataset.

## Features

- Calls Apify Google Maps Scraper via `ApifyClient`
- Dynamic input mapping from your Actor input
- Pagination-safe dataset retrieval
- Normalized output shape:
  - `business_name`
  - `phone`
  - `website` (cleaned domain)
  - `address`
  - `rating`
  - `reviews`
  - `maps_url`
- Deduplication by `maps_url`
- Summary logs for total scraped vs total unique

## Input

```json
{
  "query": "coffee shops",
  "location": "San Francisco, CA",
  "limit": 25,
  "maxConcurrency": 5
}
```

## Output

```json
{
  "business_name": "Blue Bottle Coffee",
  "phone": "+14151234567",
  "website": "bluebottlecoffee.com",
  "address": "66 Mint St, San Francisco, CA 94103, USA",
  "rating": 4.5,
  "reviews": 1203,
  "maps_url": "https://www.google.com/maps/place/..."
}
```

## Local run

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env
# then set APIFY_TOKEN in .env
```

3. Run Actor locally (example input):

```bash
APIFY_TOKEN=your_token_here node main.js
```

> Tip: When running on Apify platform, provide input in the Actor input UI and store `APIFY_TOKEN` in Actor secrets/environment variables.

## Project structure

- `main.js` - Actor entrypoint and orchestration
- `src/config.js` - defaults + input validation
- `src/googleMapsService.js` - run Google Maps Scraper + fetch dataset items
- `src/normalize.js` - normalize fields, clean domain, deduplicate
- `apify.json` - Actor metadata
- `INPUT_SCHEMA.json` - input schema definition
- `.env.example` - environment variable template
