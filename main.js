import { Actor } from 'apify';
import { log } from 'crawlee';
import { DEFAULT_INPUT, validateInput } from './src/config.js';
import { buildGoogleMapsInput, runGoogleMapsScraper } from './src/googleMapsService.js';
import { normalizeAndDeduplicate } from './src/normalize.js';

await Actor.init();

try {
  const rawInput = (await Actor.getInput()) ?? {};
  const input = {
    ...DEFAULT_INPUT,
    ...rawInput,
  };

  validateInput(input);

  if (!process.env.APIFY_TOKEN) {
    throw new Error('Missing APIFY_TOKEN. Set process.env.APIFY_TOKEN before running this actor.');
  }

  const scraperInput = buildGoogleMapsInput(input);

  log.info('Starting Google Maps Scraper run', {
    query: input.query,
    location: input.location,
    limit: input.limit,
    maxConcurrency: input.maxConcurrency,
  });

  const { items } = await runGoogleMapsScraper({
    token: process.env.APIFY_TOKEN,
    actorInput: scraperInput,
  });

  const normalizedUniqueResults = normalizeAndDeduplicate(items);

  log.info('Scraping summary', {
    totalScraped: items.length,
    totalUnique: normalizedUniqueResults.length,
  });

  await Actor.pushData(normalizedUniqueResults);
} catch (error) {
  log.exception(error, 'Actor failed');
  throw error;
} finally {
  await Actor.exit();
}
