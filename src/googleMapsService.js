import { ApifyClient } from 'apify-client';

const GOOGLE_MAPS_SCRAPER_ACTOR_ID = 'apify/google-maps-scraper';

export function buildGoogleMapsInput({ query, location, limit, maxConcurrency }) {
  return {
    searchStringsArray: [query],
    locationQuery: location,
    maxCrawledPlacesPerSearch: limit,
    maxConcurrency,
    language: 'en',
    website: 'allPlaces',
    scrapeReviewsPersonalData: false,
  };
}

export async function runGoogleMapsScraper({ token, actorInput }) {
  const client = new ApifyClient({ token });

  const run = await client.actor(GOOGLE_MAPS_SCRAPER_ACTOR_ID).call(actorInput);

  if (!run.defaultDatasetId) {
    throw new Error('Google Maps Scraper run completed without a default dataset ID.');
  }

  const datasetClient = client.dataset(run.defaultDatasetId);
  const items = await fetchAllDatasetItems(datasetClient);

  return {
    run,
    items,
  };
}

async function fetchAllDatasetItems(datasetClient) {
  const allItems = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const { items } = await datasetClient.listItems({
      clean: true,
      offset,
      limit: pageSize,
    });

    if (!items.length) break;

    allItems.push(...items);
    offset += items.length;

    if (items.length < pageSize) break;
  }

  return allItems;
}
