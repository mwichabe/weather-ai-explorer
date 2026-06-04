import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { cacheGet, cacheSet } from '../lib/cache';
import { DEFAULT_LOCATION } from '../lib/geocoding';
import type { GeoLocation, Units } from '../lib/types';

interface Settings {
  units: Units;
  location: GeoLocation;
  setUnits: (u: Units) => void;
  setLocation: (l: GeoLocation) => void;
}

const SettingsContext = createContext<Settings | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [units, setUnitsState] = useState<Units>(() => cacheGet<Units>('settings:units')?.data ?? 'metric');
  const [location, setLocationState] = useState<GeoLocation>(
    () => cacheGet<GeoLocation>('settings:location')?.data ?? DEFAULT_LOCATION,
  );

  const setUnits = useCallback((u: Units) => {
    setUnitsState(u);
    cacheSet('settings:units', u);
  }, []);

  const setLocation = useCallback((l: GeoLocation) => {
    setLocationState(l);
    cacheSet('settings:location', l);
  }, []);

  const value = useMemo(() => ({ units, location, setUnits, setLocation }), [units, location, setUnits, setLocation]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Settings {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within <SettingsProvider>');
  return ctx;
}

/* Unit helpers — conversion happens at render time only. */
export const toDisplayTemp = (c: number, units: Units): number =>
  Math.round(units === 'metric' ? c : c * 1.8 + 32);
export const toDisplayWind = (kph: number, units: Units): string =>
  units === 'metric' ? `${Math.round(kph)} km/h` : `${Math.round(kph / 1.609)} mph`;
export const toDisplayDistance = (km: number, units: Units): string =>
  units === 'metric' ? `${Math.round(km)} km` : `${Math.round(km / 1.609)} mi`;
