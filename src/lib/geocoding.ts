import { cacheGet, cacheSet, isFresh } from './cache';
import type { GeoLocation } from './types';

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const GEO_TTL = 7 * 24 * 60 * 60 * 1000;

interface RawGeoResult {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

export async function searchCities(query: string, signal?: AbortSignal): Promise<GeoLocation[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const key = `geo:${q.toLowerCase()}`;
  const cached = cacheGet<GeoLocation[]>(key);
  if (cached && isFresh(cached, GEO_TTL)) return cached.data;

  const url = `${GEO_URL}?name=${encodeURIComponent(q)}&count=6&language=en&format=json`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    if (cached) return cached.data;
    throw new Error('City search is unavailable right now.');
  }

  const json = (await res.json()) as { results?: RawGeoResult[] };
  const results: GeoLocation[] = (json.results ?? []).map((r) => ({
    name: r.name,
    country: r.country,
    admin1: r.admin1,
    lat: r.latitude,
    lon: r.longitude,
  }));

  cacheSet(key, results);
  return results;
}

export const DEFAULT_LOCATION: GeoLocation = {
  name: 'Nairobi',
  country: 'Kenya',
  admin1: 'Nairobi County',
  lat: -1.2921,
  lon: 36.8219,
};
