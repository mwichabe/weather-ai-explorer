import { CosmicBackground } from './components/CosmicBackground';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MetricsGrid } from './components/MetricsGrid';
import { Forecast } from './components/Forecast';
import { DashboardSkeleton, ErrorState, Footer } from './components/StatusViews';
import { useSettings } from './context/SettingsContext';
import { useWeather } from './hooks/useWeather';

export default function App() {
  const { location } = useSettings();
  const { data, isPending, isError, error, refetch, isFetching } = useWeather(location);

  return (
    <div className="min-h-screen">
      <CosmicBackground />
      <Navbar />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 2xl:max-w-[1600px]">
        {isPending && <DashboardSkeleton />}

        {isError && !data && (
          <ErrorState
            message={error instanceof Error ? error.message : 'Something went wrong reaching WeatherAI.'}
            onRetry={() => refetch()}
          />
        )}

        {data && (
          <>
            <Hero data={data} isRefreshing={isFetching} onRefresh={() => refetch()} />
            <MetricsGrid current={data.current} />
            <Forecast days={data.daily} />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
