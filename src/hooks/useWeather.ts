import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchWeather, weatherCacheKey } from '../lib/api';
import { cacheGet } from '../lib/cache';
import { searchCities } from '../lib/geocoding';
import type { GeoLocation, WeatherBundle } from '../lib/types';

const FIVE_MIN = 5 * 60 * 1000;
const THIRTY_MIN = 30 * 60 * 1000;

/**
 * Weather query.
 *  - queryKey is the rounded coordinate bucket → nearby lookups dedupe.
 *  - placeholderData seeds from the persistent L2 cache → instant paint on reload,
 *    then revalidates in the background (stale-while-revalidate).
 *  - staleTime 5 min: switching cities back and forth never re-hits the API
 *    inside that window; gcTime keeps memory entries 30 min.
 *  - Auto refetch every 10 min while the tab is focused keeps data live without
 *    burning quota in background tabs.
 */
export function useWeather(location: GeoLocation) {
  const key = weatherCacheKey(location.lat, location.lon);

  return useQuery<WeatherBundle>({
    queryKey: ['weather', key],
    queryFn: ({ signal }) => fetchWeather(location.lat, location.lon, signal),
    staleTime: FIVE_MIN,
    gcTime: THIRTY_MIN,
    refetchInterval: 10 * 60 * 1000,
    refetchIntervalInBackground: false,
    retry: false, // retry/backoff handled inside fetchWeather per the docs' guidance
    placeholderData: () => cacheGet<WeatherBundle>(key)?.data,
  });
}

/** Debounced upstream; cached 24h in memory + 7d in localStorage (inside searchCities). */
export function useCitySearch(query: string) {
  return useQuery({
    queryKey: ['citySearch', query.trim().toLowerCase()],
    queryFn: ({ signal }) => searchCities(query, signal),
    enabled: query.trim().length >= 2,
    staleTime: 24 * 60 * 60 * 1000,
    placeholderData: keepPreviousData,
    retry: 1,
  });
}
