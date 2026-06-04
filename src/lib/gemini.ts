import type { CurrentConditions, ForecastDay } from './types';

const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim();
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

export const hasGeminiKey = Boolean(GEMINI_API_KEY);

function buildPrompt(
  locationName: string,
  current: CurrentConditions,
  daily: ForecastDay[],
): string {
  const today = daily[0];
  const upcoming = daily
    .slice(1, 4)
    .map((d) => `${d.date}: ${d.description || 'unknown'}, ${d.minC}–${d.maxC}°C`)
    .join('; ');

  const lines = [
    `WEATHER DATA for ${locationName}:`,
    `- Condition: ${current.description}`,
    `- Temperature: ${current.tempC}°C (feels like ${current.feelsLikeC}°C)`,
    `- Humidity: ${current.humidityPct}%  |  Wind: ${current.windKph} km/h  |  Visibility: ${current.visibilityKm} km`,
  ];

  if (today) {
    const rain = today.precipChancePct != null ? `, ${today.precipChancePct}% rain chance` : '';
    lines.push(`- Today's range: ${today.minC}–${today.maxC}°C${rain}`);
  }
  if (upcoming) lines.push(`- Next 3 days: ${upcoming}`);

  lines.push(
    '',
    'TASK: Write exactly 2–3 sentences in English describing these weather conditions and giving one practical tip.',
    'RULES: English only. No greetings. No markdown. No bullet points. Plain prose only.',
  );

  return lines.join('\n');
}

export async function fetchGeminiInsight(
  locationName: string,
  current: CurrentConditions,
  daily: ForecastDay[],
  signal?: AbortSignal,
): Promise<string | undefined> {
  if (!GEMINI_API_KEY) return undefined;

  const body = {
    contents: [{ parts: [{ text: buildPrompt(locationName, current, daily) }] }],
    generationConfig: {
      maxOutputTokens: 300,
      temperature: 0.6,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!res.ok) return undefined;

    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? undefined;
  } catch {
    return undefined;
  }
}
