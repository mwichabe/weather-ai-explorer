import { useSyncExternalStore } from 'react';
import { getRateLimitSnapshot, subscribeRateLimit } from '../lib/api';
import type { RateLimitInfo } from '../lib/types';

/** Live view of the X-RateLimit-* headers from the most recent WeatherAI response. */
export function useRateLimit(): RateLimitInfo {
  return useSyncExternalStore(subscribeRateLimit, getRateLimitSnapshot, getRateLimitSnapshot);
}
