import { CloudOff, Gauge } from 'lucide-react';
import { hasApiKey } from '../lib/api';
import { useRateLimit } from '../hooks/useRateLimit';

/* ------------------------------- Skeletons ------------------------------- */

export function DashboardSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading weather">
      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <div className="glass p-10">
          <div className="skeleton h-4 w-40" />
          <div className="mt-8 flex items-center gap-10">
            <div className="skeleton h-24 w-24 !rounded-full" />
            <div className="skeleton h-28 w-56" />
          </div>
        </div>
        <div className="glass p-7">
          <div className="skeleton h-5 w-44" />
          <div className="mt-5 space-y-2.5">
            <div className="skeleton h-3.5 w-full" />
            <div className="skeleton h-3.5 w-11/12" />
            <div className="skeleton h-3.5 w-4/5" />
            <div className="skeleton h-3.5 w-2/3" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass p-6">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton mt-5 h-9 w-20" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="glass flex flex-col items-center p-5">
            <div className="skeleton h-4 w-14" />
            <div className="skeleton my-4 h-12 w-12 !rounded-full" />
            <div className="skeleton h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ Error state ------------------------------ */

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="glass mx-auto max-w-lg p-10 text-center animate-fade-up">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-nebula-rose/10 ring-1 ring-nebula-rose/30">
        <CloudOff size={24} className="text-nebula-rose" />
      </span>
      <h2 className="mt-5 text-lg font-bold text-white">Couldn’t load the weather</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{message}</p>
      <button
        onClick={onRetry}
        className="mt-6 rounded-xl bg-nebula-violet/20 px-5 py-2.5 text-sm font-semibold text-nebula-violet ring-1 ring-nebula-violet/40 transition-all duration-300 hover:scale-105 hover:bg-nebula-violet/30"
      >
        Try again
      </button>
    </div>
  );
}

/* -------------------------------- Footer --------------------------------- */

export function Footer() {
  const { limit, remaining } = useRateLimit();
  const showQuota = hasApiKey && typeof remaining === 'number';

  return (
    <footer className="mx-auto mt-14 flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-4 py-6 text-xs text-slate-500 sm:px-6 lg:px-8 2xl:max-w-[1600px]">
      <p>
        WeatherAI Explorer · Powered by the{' '}
        <a
          href="https://weather-ai.co/docs"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-nebula-violet/90 transition-colors hover:text-nebula-violet"
        >
          WeatherAI API
        </a>
      </p>
      {showQuota ? (
        <p className="flex items-center gap-1.5 tabular-nums">
          <Gauge size={12} className="text-nebula-cyan" />
          API quota: {remaining?.toLocaleString()}
          {typeof limit === 'number' ? ` / ${limit.toLocaleString()}` : ''} requests remaining
        </p>
      ) : (
        !hasApiKey && (
          <p className="flex items-center gap-1.5">
            <Gauge size={12} className="text-nebula-cyan" />
            Demo Mode — set <code className="rounded bg-white/[0.06] px-1 py-0.5">VITE_WEATHERAI_KEY</code> for live data
          </p>
        )
      )}
    </footer>
  );
}
