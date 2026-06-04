/**
 * Demo Mode data — deterministic per coordinate so the same city always renders
 * the same plausible weather (great for screenshots and reviewing the UI without a key).
 */

import type { WeatherBundle, ForecastDay } from './types';

const CODES = [0, 1, 2, 3, 61, 63, 80, 95, 45, 2, 1, 0];
const LABELS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  61: 'Light rain',
  63: 'Rain',
  80: 'Rain showers',
  95: 'Thunderstorm',
};

/** Cheap seeded PRNG (mulberry32) keyed on coordinates. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildMockBundle(lat: number, lon: number): WeatherBundle {
  const rand = rng(Math.round(lat * 1000) * 31 + Math.round(lon * 1000));

  // Warmer near the equator, cooler toward the poles.
  const baseTemp = 30 - Math.abs(lat) * 0.45 + (rand() - 0.5) * 6;
  const code = CODES[Math.floor(rand() * CODES.length)];

  const daily: ForecastDay[] = Array.from({ length: 7 }, (_, i) => {
    const dayCode = CODES[Math.floor(rand() * CODES.length)];
    const swing = (rand() - 0.5) * 5;
    const max = baseTemp + swing + 2 + rand() * 3;
    return {
      date: new Date(Date.now() + i * 86400000).toISOString().slice(0, 10),
      code: dayCode,
      description: LABELS[dayCode] ?? 'Mixed',
      maxC: Math.round(max * 10) / 10,
      minC: Math.round((max - 6 - rand() * 4) * 10) / 10,
      precipChancePct: dayCode >= 61 ? Math.round(40 + rand() * 55) : Math.round(rand() * 25),
    };
  });

  const hour = new Date().getHours();
  const isDay = hour >= 6 && hour < 18;
  const temp = Math.round((baseTemp + (isDay ? 1.5 : -2.5)) * 10) / 10;

  return {
    current: {
      tempC: temp,
      feelsLikeC: Math.round((temp + (rand() - 0.4) * 3) * 10) / 10,
      humidityPct: Math.round(45 + rand() * 45),
      windKph: Math.round((4 + rand() * 24) * 10) / 10,
      visibilityKm: Math.round((code === 45 ? 2 + rand() * 4 : 8 + rand() * 12) * 10) / 10,
      code,
      description: LABELS[code] ?? 'Mixed conditions',
      isDay,
    },
    daily,
    aiSummary:
      'Demo Mode · A mild, mostly settled stretch ahead. Expect comfortable daytime temperatures with a brief chance of showers mid-week — keep light layers handy for cooler evenings. Add your WeatherAI key to unlock live Gemini insights for this location.',
    fetchedAt: Date.now(),
    demo: true,
  };
}
