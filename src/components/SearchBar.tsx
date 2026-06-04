import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Loader2, MapPin, Search } from 'lucide-react';
import { useCitySearch } from '../hooks/useWeather';
import { useDebounce } from '../hooks/useDebounce';
import { useSettings } from '../context/SettingsContext';
import type { GeoLocation } from '../lib/types';

export function SearchBar() {
  const { setLocation } = useSettings();
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const debounced = useDebounce(input, 300);
  const { data: results = [], isFetching, isError } = useCitySearch(debounced);

  // Close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => setHighlight(0), [results]);

  const choose = (loc: GeoLocation) => {
    setLocation(loc);
    setInput('');
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(results[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const showDropdown = open && input.trim().length >= 2;

  return (
    <div ref={wrapRef} className="relative w-full max-w-md">
      <div className="glass flex items-center gap-2.5 px-4 py-2.5 transition-colors duration-300 focus-within:border-nebula-violet/50 focus-within:bg-white/[0.07]">
        {isFetching ? (
          <Loader2 size={16} className="shrink-0 animate-spin text-nebula-violet" />
        ) : (
          <Search size={16} className="shrink-0 text-slate-400" />
        )}
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search any city…"
          aria-label="Search for a city"
          className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
        <kbd className="hidden shrink-0 rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:block">
          ⏎
        </kbd>
      </div>

      {showDropdown && (
        <div className="glass-strong absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden p-1.5 animate-fade-up">
          {isError && <p className="px-3 py-2.5 text-sm text-rose-300">City search is unavailable right now.</p>}
          {!isError && results.length === 0 && !isFetching && (
            <p className="px-3 py-2.5 text-sm text-slate-400">No cities found for “{debounced}”.</p>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.lat},${r.lon}`}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => choose(r)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors duration-150 ${
                i === highlight ? 'bg-nebula-violet/15 text-white' : 'text-slate-300'
              }`}
            >
              <MapPin size={14} className="shrink-0 text-nebula-violet" />
              <span className="truncate font-medium">{r.name}</span>
              <span className="ml-auto truncate text-xs text-slate-500">
                {[r.admin1, r.country].filter(Boolean).join(', ')}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
