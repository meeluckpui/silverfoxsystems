import { Actor } from "apify";
import { ApifyClient } from "apify-client";
import { google } from "googleapis";

function extractSpreadsheetId(value) {
  if (!value) return null;

  // If they pasted a full URL, extract the /d/<ID> part.
  const match = String(value).match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match?.[1]) return match[1];

  // Otherwise assume it's already an ID
  return String(value).trim();
}

function cleanWebsiteDomain(url) {
  if (!url) return "";
  return String(url)
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .trim();
}

async function pushToGoogleSheets(rows) {
  console.log("✅ Step: Preparing Google Sheets client...");

  const rawCreds = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!rawCreds) {
    throw new Error(
      "Missing env var GOOGLE_SERVICE_ACCOUNT_JSON. Paste the full service account JSON into Apify env vars."
    );
  }

  let credentials;
  try {
    credentials = JSON.parse(rawCreds);
  } catch (e) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON. Re-paste the service account JSON exactly as downloaded."
    );
  }

  const spreadsheetId = extractSpreadsheetId(process.env.GOOGLE_SHEET_ID);
  if (!spreadsheetId) {
    throw new Error(
      "Missing env var GOOGLE_SHEET_ID. Use the spreadsheet ID (or full URL; this code can extract the ID)."
    );
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  // Header row shape:
  // A: business_name
  // B: phone
  // C: website
  // D: address
  // E: rating
  // F: reviews
  // G: maps_url
  const values = rows.map((r) => [
    r.business_name || "",
    r.phone || "",
    r.website || "",
    r.address || "",
    r.rating ?? "",
    r.reviews ?? "",
    r.maps_url || "",
  ]);

  console.log(
    `✅ Step: Appending ${values.length} rows to Google Sheets (Sheet1)...`
  );

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Sheet1!A1",
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });

  console.log("✅ Step: Pushed rows to Google Sheets successfully.");
}

await Actor.main(async () => {
  console.log("🚀 SCRIPT STARTED");

  // 1) Read input
  const input = (await Actor.getInput()) || {};
  console.log("✅ Step: Input loaded:", input);

  const query = input.query;
  const location = input.location;
  const limit = Number(input.limit ?? 10);

  if (!query || !location) {
    throw new Error("You must provide 'query' and 'location' in input.");
  }

  // 2) Create Apify client (uses Actor token automatically)
  console.log("✅ Step: Creating Apify client...");
  const client = new ApifyClient({
    token: Actor.getEnv().token,
  });

  console.log(
    `🔎 Running Google Maps scrape for: "${query}" in "${location}" (limit ${limit})`
  );

  // 3) Call the Google Places scraper actor
  console.log("✅ Step: Calling compass/crawler-google-places...");
  const run = await client.actor("compass/crawler-google-places").call({
    searchStringsArray: [query],
    locationQuery: location,
    maxCrawledPlacesPerSearch: limit,
    language: "en",
  });

  console.log("✅ Step: Actor call finished. Run:", {
    id: run?.id,
    status: run?.status,
    defaultDatasetId: run?.defaultDatasetId,
  });

  if (!run?.defaultDatasetId) {
    throw new Error("No defaultDatasetId returned from compass/crawler-google-places.");
  }

  // 4) Fetch dataset items
  console.log("✅ Step: Fetching dataset items...");
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  console.log(`✅ Step: Pulled ${items.length} raw items from dataset.`);

  // 5) Clean + dedupe
  console.log("✅ Step: Cleaning + deduping results...");
  const cleaned = [];
  const seen = new Set();

  for (const place of items) {
    const mapsUrl = place?.url || "";
    if (!mapsUrl) continue;
    if (seen.has(mapsUrl)) continue;
    seen.add(mapsUrl);

    cleaned.push({
      business_name: place?.title || null,
      phone: place?.phone || null,
      website: cleanWebsiteDomain(place?.website || ""),
      address: place?.address || null,
      rating: place?.totalScore ?? null,
      reviews: place?.reviewsCount ?? null,
      maps_url: mapsUrl,
    });
  }

  console.log(`✅ Step: Unique cleaned results: ${cleaned.length}`);

  // 6) Push to Apify dataset (your actor output)
  console.log("✅ Step: Pushing cleaned data to Apify dataset...");
  await Actor.pushData(cleaned);
  console.log("✅ Step: Pushed data to Apify dataset.");

  // 7) Push to Google Sheets
  if (cleaned.length > 0) {
    console.log("✅ Step: Sending data to Google Sheets...");
    await pushToGoogleSheets(cleaned);
  } else {
    console.log("⚠️ No cleaned results to push to Google Sheets.");
  }

  console.log("🏁 DONE");
});
