/**
 * Weather condition presentation map.
 * Primary key: WMO weather codes (0–99). Fallback: fuzzy match on description text,
 * so the UI stays correct even if the API returns only a condition string.
 */

export interface ConditionVisual {
  emoji: string;
  nightEmoji?: string;
  label: string;
}

const WMO: Record<number, ConditionVisual> = {
  0: { emoji: '☀️', nightEmoji: '🌙', label: 'Clear sky' },
  1: { emoji: '🌤️', nightEmoji: '🌙', label: 'Mainly clear' },
  2: { emoji: '⛅', nightEmoji: '☁️', label: 'Partly cloudy' },
  3: { emoji: '☁️', label: 'Overcast' },
  45: { emoji: '🌫️', label: 'Fog' },
  48: { emoji: '🌫️', label: 'Rime fog' },
  51: { emoji: '🌦️', label: 'Light drizzle' },
  53: { emoji: '🌦️', label: 'Drizzle' },
  55: { emoji: '🌧️', label: 'Heavy drizzle' },
  56: { emoji: '🌧️', label: 'Freezing drizzle' },
  57: { emoji: '🌧️', label: 'Freezing drizzle' },
  61: { emoji: '🌦️', label: 'Light rain' },
  63: { emoji: '🌧️', label: 'Rain' },
  65: { emoji: '🌧️', label: 'Heavy rain' },
  66: { emoji: '🌧️', label: 'Freezing rain' },
  67: { emoji: '🌧️', label: 'Freezing rain' },
  71: { emoji: '🌨️', label: 'Light snow' },
  73: { emoji: '🌨️', label: 'Snow' },
  75: { emoji: '❄️', label: 'Heavy snow' },
  77: { emoji: '❄️', label: 'Snow grains' },
  80: { emoji: '🌦️', label: 'Rain showers' },
  81: { emoji: '🌧️', label: 'Rain showers' },
  82: { emoji: '⛈️', label: 'Violent showers' },
  85: { emoji: '🌨️', label: 'Snow showers' },
  86: { emoji: '🌨️', label: 'Snow showers' },
  95: { emoji: '⛈️', label: 'Thunderstorm' },
  96: { emoji: '⛈️', label: 'Storm + hail' },
  99: { emoji: '⛈️', label: 'Storm + hail' },
};

const TEXT_RULES: Array<{ test: RegExp; visual: ConditionVisual }> = [
  { test: /thunder|storm/i, visual: { emoji: '⛈️', label: 'Thunderstorm' } },
  { test: /snow|sleet|blizzard/i, visual: { emoji: '🌨️', label: 'Snow' } },
  { test: /drizzle/i, visual: { emoji: '🌦️', label: 'Drizzle' } },
  { test: /shower/i, visual: { emoji: '🌦️', label: 'Showers' } },
  { test: /rain/i, visual: { emoji: '🌧️', label: 'Rain' } },
  { test: /fog|mist|haze/i, visual: { emoji: '🌫️', label: 'Fog' } },
  { test: /overcast/i, visual: { emoji: '☁️', label: 'Overcast' } },
  { test: /partly|few clouds|scattered/i, visual: { emoji: '⛅', label: 'Partly cloudy' } },
  { test: /cloud/i, visual: { emoji: '☁️', label: 'Cloudy' } },
  { test: /wind/i, visual: { emoji: '💨', label: 'Windy' } },
  { test: /clear|sun/i, visual: { emoji: '☀️', nightEmoji: '🌙', label: 'Clear' } },
];

export function conditionVisual(code: number | undefined, description?: string, isDay = true): ConditionVisual {
  let base: ConditionVisual | undefined = code !== undefined ? WMO[code] : undefined;
  if (!base && description) {
    base = TEXT_RULES.find((r) => r.test.test(description))?.visual;
  }
  base ??= { emoji: '🌡️', label: description || 'Conditions' };
  const emoji = !isDay && base.nightEmoji ? base.nightEmoji : base.emoji;
  return { ...base, emoji, label: description || base.label };
}
