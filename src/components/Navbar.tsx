import { CloudSun } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { useSettings } from '../context/SettingsContext';
import type { Units } from '../lib/types';

function UnitToggle() {
  const { units, setUnits } = useSettings();
  const options: Array<{ value: Units; label: string }> = [
    { value: 'metric', label: '°C' },
    { value: 'imperial', label: '°F' },
  ];

  return (
    <div role="radiogroup" aria-label="Temperature units" className="glass relative flex p-1">
      {/* Sliding thumb */}
      <span
        aria-hidden
        className={`absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-xl bg-nebula-violet/25 ring-1 ring-nebula-violet/40 transition-transform duration-300 ease-out ${
          units === 'imperial' ? 'translate-x-full' : 'translate-x-0'
        }`}
        style={{ left: 4 }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={units === o.value}
          onClick={() => setUnits(o.value)}
          className={`relative z-10 w-12 rounded-xl py-1.5 text-sm font-semibold transition-colors duration-300 ${
            units === o.value ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-cosmos-950/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8 2xl:max-w-[1600px]">
        {/* Logo */}
        <a href="/" className="group flex shrink-0 items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-nebula-violet/20 ring-1 ring-nebula-violet/40 shadow-glow transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <CloudSun size={18} className="text-nebula-violet" />
          </span>
          <span className="text-base font-bold tracking-tight text-white">
            WeatherAI <span className="font-medium text-nebula-violet">Explorer</span>
          </span>
        </a>

        {/* Search — full row on mobile, centered on desktop */}
        <div className="order-last w-full sm:order-none sm:mx-auto sm:w-auto sm:flex-1 sm:px-4">
          <div className="mx-auto max-w-md">
            <SearchBar />
          </div>
        </div>

        <UnitToggle />
      </div>
    </header>
  );
}
