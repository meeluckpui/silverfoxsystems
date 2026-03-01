# n8n Google Sheets URL → Email Scraper

This repo contains two importable n8n workflows that read websites from Google Sheets, scrape HTML, extract emails, and write results back to the same row.

## Files

- `workflows/sheet-url-to-email-scrape.json`
  - Contains both **Manual Trigger** and **Cron Trigger** start nodes in one workflow.
- `workflows/sheet-url-to-email-scrape.cron.json`
  - Cron-focused variant.

## Required Sheet Columns

Your tab (default `Sheet1`) must contain:

- `website` (URL input)
- `email` (primary email output)
- `emails_found` (up to 5 comma-separated emails)
- `email_status` (`email_found`, `no_email_found`, `fetch_failed`)

## Configure Google Sheets Credentials in n8n

1. Create **Google Sheets OAuth2 API** credentials in n8n.
2. Set credential name used in workflow to `YOUR_SHEETS_CREDENTIAL_NAME` (or change in nodes).
3. Set spreadsheet ID placeholder `YOUR_SPREADSHEET_ID` to your real Sheet ID.

## Ensure `rowNumber` Exists

The update step writes by `rowNumber` so only the intended row is changed.

- In **Read Sheet Rows**, ensure row metadata is returned.
- Run once and confirm each item includes `rowNumber` in execution data.

## Config Variables (Set Config node)

```js
const SHEET_TAB_NAME = 'Sheet1';
const URL_COLUMN_NAME = 'website';
const EMAIL_COLUMN_NAME = 'email';
const EMAILS_FOUND_COLUMN_NAME = 'emails_found';
const BATCH_SIZE = 25;
const REQUEST_DELAY_MS = 800;
const FETCH_CONTACT_PAGES = false;

const SKIP_IF_EMAIL_EXISTS = true;
```

## Import into n8n

1. Open n8n → **Import from File**.
2. Import either workflow JSON.
3. Re-link Google Sheets credentials.
4. Replace spreadsheet ID placeholder.
5. Save and run.

## How the workflow works

1. Trigger starts workflow (manual or cron).
2. Reads rows from Google Sheets tab.
3. Filters out rows with existing email (if configured).
4. Processes rows in batches (`Split In Batches`).
5. Normalizes URL:
   - prepends `https://` when missing
   - keeps fetchable paths
   - computes `ROOT_DOMAIN`
   - de-prioritizes Google Maps URLs by extracting real domain tokens when present
6. Fetches HTML via HTTP Request (`continueOnFail`).
7. Extracts and normalizes emails:
   - `mailto:`
   - standard email regex
   - obfuscations like `[at]`, `(dot)`
   - dedupe
   - choose first as primary
   - keep up to 5 in `emails_found`
8. Wait node applies request pacing (`REQUEST_DELAY_MS`).
9. Updates same row by `rowNumber` with only:
   - `email`
   - `emails_found`
   - `email_status`

## Test with 3 sample rows

Use headers: `website | email | emails_found | email_status`

Sample values:

1. `example.com`
2. `https://www.iana.org/domains/reserved`
3. `www.python.org` with `email` prefilled (to test skip behavior)

Run manual trigger and verify:

- Row 3 is skipped when `SKIP_IF_EMAIL_EXISTS = true`
- Other rows are updated with status values

## Common issues

### 403 / 429 / blocked requests

- Increase `REQUEST_DELAY_MS` (e.g. 1500–3000)
- Decrease `BATCH_SIZE` (e.g. 5–10)
- Keep `FETCH_CONTACT_PAGES = false` unless needed

### Timeouts

- Increase HTTP node timeout
- Reduce batch size and increase delay

### No emails found

- Set `FETCH_CONTACT_PAGES = true`
- Site may be JS-rendered without server-side emails

### Update failures

- Verify `rowNumber` is present
- Check spreadsheet ID/tab name
- Confirm OAuth credential has edit permissions
