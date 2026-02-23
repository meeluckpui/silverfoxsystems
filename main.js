import { Actor } from 'apify';
import { ApifyClient } from 'apify-client';

await Actor.init();

const input = await Actor.getInput();
const query = input?.query;
const location = input?.location;
const limit = input?.limit || 10;

if (!query || !location) {
    throw new Error('query and location are required.');
}

const client = new ApifyClient({
    token: process.env.APIFY_TOKEN,
});

console.log(`Running Google Maps scrape for: ${query} in ${location}`);
const run = await client.actor("apify/google-maps-scraper").call({
    searchStringsArray: [query],
    locationQuery: location,
    maxCrawledPlacesPerSearch: limit,
    language: "en",
    website: "allPlaces"
});
const run = await client.actor("apify/google-maps-scraper").call({
    searchStringsArray: [query],
    locationQuery: location,
    maxCrawledPlacesPerSearch: limit,
    language: "en",
    website: "allPlaces"
});
const { items } = await client.dataset(run.defaultDatasetId).listItems();
const cleaned = [];
const seen = new Set();

for (const place of items) {
    if (!place.url) continue;
    if (seen.has(place.url)) continue;
    seen.add(place.url);

    const website = place.website
        ? place.website.replace(/^https?:\/\//, "")
              .replace(/^www\./, "")
              .split("/")[0]
        : null;

    cleaned.push({
        business_name: place.title || null,
        phone: place.phone || null,
        website,
        address: place.address || null,
        rating: place.totalScore || null,
        reviews: place.reviewsCount || null,
        maps_url: place.url
    });
}

console.log(`Total scraped: ${items.length}`);
console.log(`Total unique: ${cleaned.length}`);

await Actor.pushData(cleaned);
await Actor.exit();
