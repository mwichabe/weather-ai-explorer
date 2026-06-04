/**
 * WeatherAI API client — GET /v1/weather
 * Docs: https://weather-ai.co/docs · Base URL: https://api.weather-ai.co
 *
 * Design decisions:
 *  1. Always fetch `units=metric` and convert °F at render time — the unit toggle is
 *     instantaneous and never burns request quota.
 *  2. `ai=true` only when a Gemini insight is actually displayed (hero card), per the
 *     docs' advice to preserve the separate AI quota.
 *  3. Defensive normalization: the raw payload is mapped into our own `WeatherBundle`
 *     so the UI is insulated from upstream field-name variations.
 *  4. Rate-limit headers (X-RateLimit-*) are captured into a tiny external store and
 *     surfaced in the footer via useSyncExternalStore.
 *  5. No key configured → graceful Demo Mode with deterministic mock data.
 */

import { cacheGet, cacheSet } from './cache';
import { buildMockBundle } from './mockData';
import type { RateLimitInfo, WeatherBundle, CurrentConditions, ForecastDay } from './types';

const BASE_URL = '/weather-proxy';
const API_KEY = (import.meta.env.VITE_WEATHERAI_KEY as string | undefined)?.trim();

export const hasApiKey = Boolean(API_KEY && API_KEY.startsWith('wai_'));

let rateLimit: RateLimitInfo = {};
const rlListeners = new Set<() => void>();

export function subscribeRateLimit(listener: () => void): () => void {
  rlListeners.add(listener);
  return () => rlListeners.delete(listener);
}
export function getRateLimitSnapshot(): RateLimitInfo {
  return rateLimit;
}
function setRateLimit(headers: Headers): void {
  const limit = Number(headers.get('X-RateLimit-Limit'));
  const remaining = Number(headers.get('X-RateLimit-Remaining'));
  const reset = Number(headers.get('X-RateLimit-Reset'));
  if (!Number.isFinite(limit) && !Number.isFinite(remaining)) return;
  rateLimit = {
    limit: Number.isFinite(limit) ? limit : rateLimit.limit,
    remaining: Number.isFinite(remaining) ? remaining : rateLimit.remaining,
    reset: Number.isFinite(reset) ? reset : rateLimit.reset,
  };
  rlListeners.forEach((l) => l());
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function errorForStatus(status: number): ApiError {
  switch (status) {
    case 401:
      return new ApiError('Unauthorized — check that VITE_WEATHERAI_KEY is a valid wai_ key.', status, false);
    case 403:
      return new ApiError('Forbidden — this feature is not included in your WeatherAI plan.', status, false);
    case 429:
      return new ApiError('Monthly quota exceeded. Showing the most recent cached data instead.', status, false);
    case 400:
      return new ApiError('Bad request — missing or invalid coordinates.', status, false);
    case 503:
      return new ApiError('WeatherAI is temporarily unavailable. Retrying shortly…', status, true);
    default:
      return new ApiError(`WeatherAI request failed (HTTP ${status}).`, status, status >= 500);
  }
}

type Raw = Record<string, unknown>;

const num = (v: unknown): number | undefined => {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
};
const str = (v: unknown): string | undefined => (typeof v === 'string' && v.length > 0 ? v : undefined);
const pick = (obj: Raw | undefined, ...keys: string[]): unknown => {
  if (!obj) return undefined;
  for (const k of keys) if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  return undefined;
};

function normalizeCurrent(raw: Raw): CurrentConditions {
  const cur = (pick(raw, 'current', 'current_weather', 'now', 'currentConditions') as Raw) ?? raw;
  const temp = num(pick(cur, 'temp', 'temperature', 'temp_c', 'temperature_2m')) ?? 0;
  return {
    tempC: temp,
    feelsLikeC: num(pick(cur, 'feels_like', 'feelsLike', 'apparent_temperature', 'feelslike_c')) ?? temp,
    humidityPct: num(pick(cur, 'humidity', 'relative_humidity', 'relative_humidity_2m')) ?? 0,
    windKph: num(pick(cur, 'wind_speed', 'windSpeed', 'wind_kph', 'wind_speed_10m', 'wind')) ?? 0,
    visibilityKm: num(pick(cur, 'visibility', 'visibility_km', 'vis_km')) ?? 10,
    code: num(pick(cur, 'weather_code', 'weatherCode', 'code', 'condition_code')) ?? -1,
    description:
      str(pick(cur, 'description', 'condition', 'summary', 'weather', 'condition_text')) ?? 'Current conditions',
    isDay: (() => {
      const d = pick(cur, 'is_day', 'isDay', 'daytime');
      if (typeof d === 'boolean') return d;
      if (typeof d === 'number') return d === 1;
      const h = new Date().getHours();
      return h >= 6 && h < 18;
    })(),
  };
}

function normalizeDaily(raw: Raw): ForecastDay[] {
  const list = (pick(raw, 'daily', 'forecast', 'days', 'forecast_days') ?? []) as unknown;

  // Shape A: array of day objects
  if (Array.isArray(list)) {
    return list.map((d, i) => {
      const day = d as Raw;
      return {
        date:
          str(pick(day, 'date', 'day', 'time', 'datetime')) ??
          new Date(Date.now() + i * 86400000).toISOString().slice(0, 10),
        code: num(pick(day, 'weather_code', 'weatherCode', 'code', 'condition_code')) ?? -1,
        description: str(pick(day, 'description', 'condition', 'summary', 'condition_text')) ?? '',
        minC: num(pick(day, 'temp_min', 'min', 'min_temp', 'temperature_2m_min', 'mintemp_c', 'low')) ?? 0,
        maxC: num(pick(day, 'temp_max', 'max', 'max_temp', 'temperature_2m_max', 'maxtemp_c', 'high')) ?? 0,
        precipChancePct: num(
          pick(day, 'precipitation_probability', 'precip_chance', 'pop', 'precipitation_probability_max'),
        ),
      };
    });
  }

  // Shape B: columnar arrays (Open-Meteo style: { time: [], temperature_2m_max: [] ... })
  if (list && typeof list === 'object') {
    const cols = list as Raw;
    const dates = (pick(cols, 'time', 'date', 'dates') as unknown[]) ?? [];
    return dates.map((date, i) => ({
      date: String(date),
      code: num((pick(cols, 'weather_code', 'weathercode') as unknown[] | undefined)?.[i]) ?? -1,
      description: '',
      minC: num((pick(cols, 'temperature_2m_min', 'temp_min', 'min') as unknown[] | undefined)?.[i]) ?? 0,
      maxC: num((pick(cols, 'temperature_2m_max', 'temp_max', 'max') as unknown[] | undefined)?.[i]) ?? 0,
      precipChancePct: num(
        (pick(cols, 'precipitation_probability_max', 'pop') as unknown[] | undefined)?.[i],
      ),
    }));
  }

  return [];
}

export function normalizeWeather(raw: Raw): WeatherBundle {
  const ai = pick(raw, 'ai_summary', 'aiSummary', 'ai', 'summary', 'insight', 'gemini_summary');
  const aiText =
    typeof ai === 'string' ? ai : str(pick(ai as Raw, 'summary', 'text', 'message', 'insight'));
  return {
    current: normalizeCurrent(raw),
    daily: normalizeDaily(raw).slice(0, 7),
    aiSummary: aiText,
    fetchedAt: Date.now(),
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function weatherCacheKey(lat: number, lon: number): string {
  // 2-decimal rounding ≈ 1.1 km buckets → nearby searches share cache entries.
  return `weather:${lat.toFixed(2)},${lon.toFixed(2)}`;
}

export async function fetchWeather(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<WeatherBundle> {
  if (!hasApiKey) {
    await sleep(450);
    return { ...buildMockBundle(lat, lon), demo: true };
  }

  const paramSets: Record<string, string>[] = [
    { lat: String(lat), lon: String(lon), units: 'metric' },
    { lat: String(lat), lon: String(lon) },
  ];
  const key = weatherCacheKey(lat, lon);

  for (const paramSet of paramSets) {
    const url = `${BASE_URL}/v1/weather?${new URLSearchParams(paramSet)}`;
    const maxAttempts = 2;
    let lastStatus = 0;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await fetch(url, {
          signal,
          headers: { Authorization: `Bearer ${API_KEY}` },
        });
        setRateLimit(res.headers);
        lastStatus = res.status;

        if (!res.ok) {
          const err = errorForStatus(res.status);
          if (err.retryable && attempt < maxAttempts) {
            await sleep(2 ** attempt * 400);
            continue;
          }
          break;
        }

        const bundle = normalizeWeather((await res.json()) as Raw);
        cacheSet(key, bundle);
        return bundle;
      } catch (e) {
        if ((e as Error).name === 'AbortError') throw e;
        const retryable = !(e instanceof ApiError) || e.retryable;
        if (retryable && attempt < maxAttempts) {
          await sleep(2 ** attempt * 400);
          continue;
        }
        break;
      }
    }

    if (lastStatus > 0 && lastStatus < 500) break;
  }

  const stale = cacheGet<WeatherBundle>(key);
  if (stale) return stale.data;
  return { ...buildMockBundle(lat, lon), demo: true };
}
