function cleanWebsiteDomain(rawWebsite) {
  if (!rawWebsite || typeof rawWebsite !== 'string') return null;

  try {
    const normalizedUrl = rawWebsite.startsWith('http') ? rawWebsite : `https://${rawWebsite}`;
    const parsed = new URL(normalizedUrl);
    return parsed.hostname.replace(/^www\./i, '') || null;
  } catch {
    return null;
  }
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function normalizeGoogleMapsItem(item) {
  const mapsUrl = item.url ?? item.placeUrl ?? null;

  return {
    business_name: item.title ?? item.name ?? null,
    phone: item.phoneUnformatted ?? item.phone ?? null,
    website: cleanWebsiteDomain(item.website),
    address: item.address ?? null,
    rating: toNumberOrNull(item.totalScore ?? item.rating),
    reviews: toNumberOrNull(item.reviewsCount ?? item.reviews),
    maps_url: mapsUrl,
  };
}

export function normalizeAndDeduplicate(items) {
  const seen = new Set();
  const normalized = [];

  for (const item of items) {
    const mapped = normalizeGoogleMapsItem(item);

    if (!mapped.maps_url) continue;
    if (seen.has(mapped.maps_url)) continue;

    seen.add(mapped.maps_url);
    normalized.push(mapped);
  }

  return normalized;
}
