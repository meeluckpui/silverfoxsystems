export const DEFAULT_INPUT = {
  limit: 25,
  maxConcurrency: 5,
};

export function validateInput(input) {
  const { query, location, limit, maxConcurrency } = input;

  if (!query || typeof query !== 'string') {
    throw new Error('Input validation failed: "query" must be a non-empty string.');
  }

  if (!location || typeof location !== 'string') {
    throw new Error('Input validation failed: "location" must be a non-empty string.');
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error('Input validation failed: "limit" must be an integer greater than 0.');
  }

  if (!Number.isInteger(maxConcurrency) || maxConcurrency < 1) {
    throw new Error('Input validation failed: "maxConcurrency" must be an integer greater than 0.');
  }
}
