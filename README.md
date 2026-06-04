# WeatherAI Explorer 🌌

A premium, dark-cosmic weather dashboard built on the **WeatherAI API** (`GET /v1/weather`).
React 18 · Vite · TypeScript · Tailwind CSS · TanStack Query.

![stack](https://img.shields.io/badge/React-18-58c7f3) ![stack](https://img.shields.io/badge/TypeScript-strict-5d6cfa) ![stack](https://img.shields.io/badge/TanStack_Query-v5-8b7cf6)

## Features

- **Hero panel** — massive current temperature, condition emoji, location, and a glowing **Gemini AI Insight** card fed directly from the API's `ai=true` summaries.
- **Glassmorphic metric grid** — Feels Like, Humidity, Wind, Visibility, each with contextual hints.
- **7-day forecast** — large icons, high/low temps, per-day min→max range bars scaled across the week, precipitation chance, hover micro-animations.
- **City search** — debounced, keyboard-navigable (↑ ↓ ⏎ Esc), powered by Open-Meteo geocoding (the WeatherAI endpoints are coordinate-based).
- **°C/°F toggle** — instant, persisted, and **free**: data is fetched once in metric and converted at render time, so toggling never burns API quota.
- **Cosmic backdrop** — canvas starfield with twinkle + three faint drifting aurora glows; respects `prefers-reduced-motion`.
- **Live quota meter** — the footer surfaces `X-RateLimit-Remaining` / `X-RateLimit-Limit` from the most recent response.
- **Demo Mode** — no key? The app runs on deterministic, coordinate-seeded mock data so the full UI is reviewable instantly.

## 🚀 Getting started

```bash
npm install
cp .env.example .env
npm run dev
```

| Env var                   | Purpose                                                              |
| ------------------------- | -------------------------------------------------------------------- |
| `VITE_WEATHERAI_KEY`      | Your `wai_...` API key from Dashboard → API Keys. Empty ⇒ Demo Mode. |
| `VITE_WEATHERAI_BASE_URL` | Optional override of `https://api.weather-ai.co`.                    |

> Vite exposes `VITE_*` variables to the browser bundle. That's fine for a portfolio/demo, but for production you'd proxy WeatherAI calls through a thin backend so the key never ships to clients.

## API integration, state & caching

**Endpoint used:** `GET /v1/weather?lat&lon&days=7&units=metric&ai=true`

The integration is layered deliberately:

```
UI components
   ↓ (domain types only — never raw JSON)
useWeather()        TanStack Query  ←  L1: in-memory cache
   ↓                                    · request dedup & aborts (AbortSignal)
fetchWeather()      lib/api.ts          · staleTime 5 min, gcTime 30 min
   ↓                                    · focus/reconnect revalidation
normalizeWeather()                      · 10-min foreground polling
   ↓
localStorage        lib/cache.ts    ←  L2: persistent cache
                                        · instant first paint via placeholderData
                                        · offline / 429 stale fallback
                                        · versioned keys + quota-safe eviction
```

Key decisions:

1. **Stale-while-revalidate everywhere.** On reload, the last good bundle paints instantly from localStorage while a background refetch revalidates. Switching between recently-viewed cities is instant and quota-free within the 5-minute `staleTime`.
2. **Coordinate bucketing.** Cache keys round lat/lon to 2 decimals (~1.1 km), so adjacent geocoder hits for the same city share one cache entry — fewer requests, same accuracy.
3. **Quota-aware by design.** Units convert client-side (one fetch serves both °C and °F); polling pauses in background tabs; rate-limit headers are surfaced in the UI; retries are reserved for retryable statuses (`500/503`) with exponential backoff, exactly as the docs recommend.
4. **Graceful degradation.** `429`/network failures fall back to the last cached bundle instead of a dead screen; only a true cold-start failure shows the error state (with retry).
5. **Defensive normalization.** Raw payloads are mapped into typed `WeatherBundle` objects (`lib/types.ts`) tolerant of multiple field-name conventions and both row-based and columnar daily shapes — the UI is fully insulated from upstream changes.

## 🗂 Structure

```
src/
├── lib/            api client, cache layer, geocoding, normalizers, types, mock data
├── hooks/          useWeather, useCitySearch, useDebounce, useRateLimit
├── context/        SettingsContext (units + location, persisted)
└── components/     Navbar, SearchBar, Hero, MetricsGrid, Forecast, CosmicBackground, StatusViews
```

## 🛠 Scripts

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Vite dev server                          |
| `npm run build`   | Type-check (`tsc -b`) + production build |
| `npm run preview` | Preview the production build             |

## Notes & assumptions

- The docs don't publish the exact `/v1/weather` response JSON, so `normalizeWeather()` is intentionally tolerant (multiple alias keys per field, array or columnar daily data). If your account's payload differs, the only file to touch is `src/lib/api.ts`.
- Free plan = 1,000 req/mo and 200 AI req/mo. If you want to stretch the AI quota further, flip `ai` to `'false'` in `fetchWeather()` — the insight card will explain the absence gracefully.
- Geocoding uses Open-Meteo's free endpoint (no key) because WeatherAI's weather routes take coordinates; results are cached for 7 days.
