export type Units = 'metric' | 'imperial';

export interface GeoLocation {
  name: string;
  country?: string;
  admin1?: string;
  lat: number;
  lon: number;
}

export interface CurrentConditions {
  tempC: number;
  feelsLikeC: number;
  humidityPct: number;
  windKph: number;
  visibilityKm: number;
  code: number;
  description: string;
  isDay: boolean;
}

export interface ForecastDay {
  date: string;
  code: number;
  description: string;
  minC: number;
  maxC: number;
  precipChancePct?: number;
}

export interface WeatherBundle {
  current: CurrentConditions;
  daily: ForecastDay[];
  aiSummary?: string;
  fetchedAt: number;
  demo?: boolean;
}

export interface RateLimitInfo {
  limit?: number;
  remaining?: number;
  reset?: number;
}
