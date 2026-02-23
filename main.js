import { google } from "googleapis";
import { Actor } from 'apify';
import { ApifyClient } from 'apify-client';

await Actor.init();

const input = await Actor.getInput();
const query = input.query;
const location = input.location;
const limit = input.limit || 10;

if (!query || !location) {
    throw new Error('query and location are required.');
}

const client = new ApifyClient({
    token: process.env.APIFY_TOKEN,
});

console.log(`Running Google Maps scrape for: ${query} in ${location}`);

// 1️⃣ Call official Google Maps Scraper
const run = await client.actor("compass/crawler-google-places").call({
    searchStringsArray: [query],
    locationQuery: location,
    maxCrawledPlacesPerSearch: limit,
    language: "en",
});
// 2️⃣ Get dataset items
const { items } = await client.dataset(run.defaultDatasetId).listItems();

// 3️⃣ Clean results
const cleaned = [];
const seen = new Set();

for (const place of items) {
    if (!place.url) continue;
    if (seen.has(place.url)) continue;
    seen.add(place.url);

    const website = place.website
        ? place.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
        : null;

    cleaned.push({
        business_name: place.title || null,
        phone: place.phone || null,
        website,
        address: place.address || null,
        rating: place.totalScore || null,
        reviews: place.reviewsCount || null,
        maps_url: place.url,
    });
}

// 4️⃣ Output cleaned data
await Actor.pushData(cleaned);
async function pushToGoogleSheets(rows) {
    const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const values = rows.map(r => [
        r.business_name || "",
        r.phone || "",
        r.emails || "",
        r.website || ""
    ]);

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Sheet1!A1",
        valueInputOption: "RAW",
        requestBody: { values },
    });

    console.log("Pushed to Google Sheets");
}

if (cleaned.length > 0) {
    await pushToGoogleSheets(cleaned);
}
console.log(`Total scraped: ${items.length}`);
console.log(`Total unique: ${cleaned.length}`);

await Actor.exit();
