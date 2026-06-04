import { Droplets, Eye, Thermometer, Wind } from 'lucide-react';
import { toDisplayDistance, toDisplayTemp, toDisplayWind, useSettings } from '../context/SettingsContext';
import type { CurrentConditions } from '../lib/types';
import type { LucideIcon } from 'lucide-react';

interface Metric {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  accent: string; // tailwind text color class
}

function humidityHint(pct: number): string {
  if (pct < 30) return 'Dry air';
  if (pct < 60) return 'Comfortable';
  if (pct < 80) return 'Humid';
  return 'Very humid';
}
function windHint(kph: number): string {
  if (kph < 12) return 'Light breeze';
  if (kph < 29) return 'Moderate breeze';
  if (kph < 50) return 'Strong breeze';
  return 'High wind';
}
function visibilityHint(km: number): string {
  if (km >= 10) return 'Excellent';
  if (km >= 5) return 'Good';
  if (km >= 2) return 'Moderate';
  return 'Poor';
}

export function MetricsGrid({ current }: { current: CurrentConditions }) {
  const { units } = useSettings();
  const degree = `°${units === 'metric' ? 'C' : 'F'}`;
  const feelsDelta = current.feelsLikeC - current.tempC;

  const metrics: Metric[] = [
    {
      icon: Thermometer,
      label: 'Feels Like',
      value: `${toDisplayTemp(current.feelsLikeC, units)}${degree}`,
      hint:
        Math.abs(feelsDelta) < 1
          ? 'Matches the actual temperature'
          : feelsDelta > 0
            ? 'Warmer than the actual reading'
            : 'Cooler than the actual reading',
      accent: 'text-nebula-rose',
    },
    {
      icon: Droplets,
      label: 'Humidity',
      value: `${Math.round(current.humidityPct)}%`,
      hint: humidityHint(current.humidityPct),
      accent: 'text-nebula-cyan',
    },
    {
      icon: Wind,
      label: 'Wind',
      value: toDisplayWind(current.windKph, units),
      hint: windHint(current.windKph),
      accent: 'text-nebula-indigo',
    },
    {
      icon: Eye,
      label: 'Visibility',
      value: toDisplayDistance(current.visibilityKm, units),
      hint: visibilityHint(current.visibilityKm),
      accent: 'text-nebula-violet',
    },
  ];

  return (
    <section aria-label="Current weather metrics" className="grid grid-cols-2 gap-4 sm:gap-5 xl:grid-cols-4">
      {metrics.map((m, i) => (
        <article
          key={m.label}
          className="glass glass-hover group p-5 sm:p-6 animate-fade-up"
          style={{ animationDelay: `${0.08 * (i + 1)}s` }}
        >
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.05] ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-110">
              <m.icon size={16} className={m.accent} />
            </span>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{m.label}</h3>
          </div>
          <p className="mt-4 text-3xl font-bold tracking-tight text-white tabular-nums sm:text-4xl">{m.value}</p>
          <p className="mt-1.5 text-xs text-slate-500">{m.hint}</p>
        </article>
      ))}
    </section>
  );
}
