import { CalendarDays, Umbrella } from 'lucide-react';
import { conditionVisual } from '../lib/weatherCodes';
import { toDisplayTemp, useSettings } from '../context/SettingsContext';
import type { ForecastDay } from '../lib/types';

function dayLabel(iso: string, index: number): string {
  if (index === 0) return 'Today';
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { weekday: 'short' });
}
function dateLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function Forecast({ days }: { days: ForecastDay[] }) {
  const { units } = useSettings();
  if (days.length === 0) return null;

  // Range bar scale across the whole week
  const weekMin = Math.min(...days.map((d) => d.minC));
  const weekMax = Math.max(...days.map((d) => d.maxC));
  const span = Math.max(weekMax - weekMin, 1);

  return (
    <section aria-label="7 day forecast" className="animate-fade-up" style={{ animationDelay: '0.35s' }}>
      <div className="mb-4 flex items-center gap-2.5">
        <CalendarDays size={16} className="text-nebula-cyan" />
        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-300">7-Day Forecast</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-7">
        {days.map((d, i) => {
          const visual = conditionVisual(d.code, d.description);
          const left = ((d.minC - weekMin) / span) * 100;
          const width = Math.max(((d.maxC - d.minC) / span) * 100, 8);
          return (
            <article
              key={d.date}
              className={`glass glass-hover group flex flex-col items-center p-4 text-center sm:p-5 ${
                i === 0 ? 'ring-1 ring-nebula-violet/30' : ''
              }`}
            >
              <p className={`text-sm font-bold ${i === 0 ? 'text-nebula-violet' : 'text-slate-200'}`}>
                {dayLabel(d.date, i)}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">{dateLabel(d.date)}</p>

              <span
                aria-hidden
                className="my-4 select-none text-4xl transition-transform duration-300 ease-out group-hover:scale-125 group-hover:-rotate-6 sm:text-5xl"
              >
                {visual.emoji}
              </span>

              <p className="text-sm font-semibold text-white tabular-nums">
                {toDisplayTemp(d.maxC, units)}°
                <span className="ml-1.5 font-medium text-slate-500">{toDisplayTemp(d.minC, units)}°</span>
              </p>

              {/* Min→max range bar positioned on the week's scale */}
              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-nebula-violet/70 transition-all duration-500"
                  style={{ marginLeft: `${left}%`, width: `${width}%` }}
                />
              </div>

              {typeof d.precipChancePct === 'number' && (
                <p className="mt-2.5 flex items-center gap-1 text-[11px] font-medium text-nebula-cyan/90">
                  <Umbrella size={11} /> {Math.round(d.precipChancePct)}%
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
