import { MapPin, RefreshCw } from 'lucide-react';
import { conditionVisual } from '../lib/weatherCodes';
import { toDisplayTemp, useSettings } from '../context/SettingsContext';
import { AIInsightCard } from './AIInsightCard';
import type { WeatherBundle } from '../lib/types';

function timeAgo(epochMs: number): string {
  const mins = Math.max(0, Math.round((Date.now() - epochMs) / 60000));
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 min ago';
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.round(mins / 60);
  return hrs === 1 ? '1 hour ago' : `${hrs} hours ago`;
}

interface HeroProps {
  data: WeatherBundle;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function Hero({ data, isRefreshing, onRefresh }: HeroProps) {
  const { units, location } = useSettings();
  const { current, fetchedAt, demo } = data;
  const visual = conditionVisual(current.code, current.description, current.isDay);

  return (
    <section className="grid items-stretch gap-5 lg:grid-cols-[1.25fr_1fr] animate-fade-up">
      {/* Current conditions */}
      <div className="glass-strong relative overflow-hidden p-7 sm:p-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-slate-400">
              <MapPin size={14} className="text-nebula-cyan" />
              {location.name}
              {location.country ? `, ${location.country}` : ''}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Updated {timeAgo(fetchedAt)}
              {demo && <span className="ml-2 rounded-full bg-nebula-cyan/15 px-2 py-0.5 text-[10px] font-semibold text-nebula-cyan ring-1 ring-nebula-cyan/30">DEMO MODE</span>}
            </p>
          </div>
          <button
            onClick={onRefresh}
            aria-label="Refresh weather"
            className="glass grid h-9 w-9 shrink-0 place-items-center !rounded-xl text-slate-400 transition-all duration-300 hover:scale-110 hover:text-white"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-nebula-violet' : ''} />
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-6 sm:gap-10">
          <span
            aria-hidden
            className="select-none text-7xl drop-shadow-[0_0_36px_rgba(139,124,246,0.35)] sm:text-8xl animate-pulse-soft"
          >
            {visual.emoji}
          </span>
          <div>
            <p className="text-8xl font-extrabold leading-none tracking-tighter text-white tabular-nums sm:text-9xl 2xl:text-[11rem]">
              {toDisplayTemp(current.tempC, units)}
              <span className="align-top text-4xl font-semibold text-nebula-violet sm:text-5xl">
                °{units === 'metric' ? 'C' : 'F'}
              </span>
            </p>
            <p className="mt-2 text-lg font-medium capitalize text-slate-300">{visual.label}</p>
          </div>
        </div>
      </div>

      <AIInsightCard
        current={current}
        daily={data.daily}
        locationName={location.name}
      />
    </section>
  );
}
