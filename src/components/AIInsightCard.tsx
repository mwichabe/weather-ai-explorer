import { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw, Brain, AlertCircle } from 'lucide-react';
import { fetchGeminiInsight, hasGeminiKey } from '../lib/gemini';
import type { CurrentConditions, ForecastDay } from '../lib/types';

type Phase = 'idle' | 'loading' | 'done' | 'error';

const STEPS = [
  'Reading temperature…',
  'Analyzing humidity…',
  'Checking wind patterns…',
  'Scanning the forecast…',
  'Composing your insight…',
];

interface Props {
  current: CurrentConditions;
  daily: ForecastDay[];
  locationName: string;
}

export function AIInsightCard({ current, daily, locationName }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [fullText, setFullText] = useState('');
  const [displayed, setDisplayed] = useState('');
  const [stepIdx, setStepIdx] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (phase !== 'done') return;
    setDisplayed('');
    let i = 0;
    const id = setInterval(() => {
      setDisplayed(fullText.slice(0, ++i));
      if (i >= fullText.length) clearInterval(id);
    }, 22);
    return () => clearInterval(id);
  }, [fullText, phase]);

  useEffect(() => {
    if (phase !== 'loading') return;
    const id = setInterval(() => setStepIdx((s) => (s + 1) % STEPS.length), 1100);
    return () => clearInterval(id);
  }, [phase]);

  const generate = async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setPhase('loading');
    setStepIdx(0);
    const result = await fetchGeminiInsight(locationName, current, daily, ctrl.signal);
    if (ctrl.signal.aborted) return;
    if (result) {
      setFullText(result);
      setPhase('done');
    } else {
      setPhase('error');
    }
  };

  const isDone = phase === 'done';
  const isLoading = phase === 'loading';

  return (
    <div className="glass glow-border relative flex flex-col overflow-hidden p-6 sm:p-7">
      {/* Ambient glow blob */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full opacity-[0.15]"
        style={{ background: 'radial-gradient(circle, #8b7cf6 0%, transparent 68%)' }}
      />
      {/* Subtle scan line on loading */}
      {isLoading && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-nebula-violet/60"
          style={{ animation: 'shimmer 1.8s linear infinite' }}
        />
      )}

      {/* ── Header ── */}
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-nebula-violet/20 ring-1 ring-nebula-violet/40">
            <Sparkles
              size={15}
              className={`text-nebula-violet transition-transform ${isLoading ? 'animate-spin' : ''}`}
            />
            {isLoading && (
              <span className="absolute inset-0 rounded-lg animate-ping bg-nebula-violet/25" />
            )}
          </span>
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-nebula-violet">
            AI Insight
          </h2>
        </div>
        {isDone && (
          <button
            onClick={generate}
            aria-label="Regenerate insight"
            title="Regenerate"
            className="glass grid h-7 w-7 place-items-center !rounded-lg text-slate-500 transition-all duration-300 hover:scale-110 hover:text-nebula-violet"
          >
            <RefreshCw size={12} />
          </button>
        )}
      </div>

      {/* ── Body ── */}
      <div className="relative mt-5 flex flex-1 flex-col">
        {phase === 'idle'    && <IdleState    onGenerate={generate} />}
        {phase === 'loading' && <LoadingState step={STEPS[stepIdx]} />}
        {phase === 'done'    && <DoneState    text={displayed} complete={displayed.length >= fullText.length} />}
        {phase === 'error'   && <ErrorState   onRetry={generate} />}
      </div>

      {/* ── Footer ── */}
      {isDone && (
        <p className="relative mt-4 text-[11px] font-medium uppercase tracking-wider text-slate-500">
          AI Weather Intelligence · {locationName}
        </p>
      )}
    </div>
  );
}

/* ─────────────── Idle ─────────────── */

function IdleState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 py-2">
      {/* Radar rings */}
      <div className="relative flex h-[88px] w-[88px] items-center justify-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute rounded-full border border-nebula-violet/35"
            style={{
              width:  `${100 - i * 24}%`,
              height: `${100 - i * 24}%`,
              animation: 'radarPing 2.4s ease-out infinite',
              animationDelay: `${i * 0.65}s`,
            }}
          />
        ))}
        <span className="relative grid h-14 w-14 place-items-center rounded-full bg-nebula-violet/10 ring-1 ring-nebula-violet/30 shadow-glow">
          <Brain size={24} className="text-nebula-violet" />
        </span>
      </div>

      <div className="text-center">
        <p className="text-[15px] font-semibold text-slate-200">
          {hasGeminiKey ? 'Ready to analyse' : 'AI key not configured'}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {hasGeminiKey
            ? 'Get a personalised insight for current conditions'
            : 'Set VITE_GEMINI_API_KEY to enable AI insights'}
        </p>
      </div>

      <button
        onClick={onGenerate}
        disabled={!hasGeminiKey}
        className="group flex items-center gap-2 rounded-xl bg-nebula-violet/20 px-5 py-2.5 text-sm font-semibold text-nebula-violet ring-1 ring-nebula-violet/40 transition-all duration-300 hover:scale-105 hover:bg-nebula-violet/30 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Sparkles size={14} className="transition-transform duration-300 group-hover:rotate-12" />
        Generate Insight
      </button>

      <p className="text-[11px] text-slate-600">Instant · Contextual · Private</p>
    </div>
  );
}

/* ─────────────── Loading ─────────────── */

function LoadingState({ step }: { step: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 py-2">
      <div className="flex items-end gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-full bg-nebula-violet"
            style={{
              animation: 'dotBounce 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </div>
      <p
        key={step}
        className="text-sm text-slate-400"
        style={{ animation: 'stepFadeIn 0.35s ease-out both' }}
      >
        {step}
      </p>
    </div>
  );
}

/* ─────────────── Done ─────────────── */

function DoneState({ text, complete }: { text: string; complete: boolean }) {
  return (
    <p
      className="flex-1 text-[15px] leading-relaxed text-slate-300"
      style={{ animation: 'insightReveal 0.4s ease-out both' }}
    >
      {text}
      {!complete && (
        <span
          className="ml-0.5 inline-block h-[1.1em] w-0.5 translate-y-0.5 rounded-sm bg-nebula-violet align-middle"
          style={{ animation: 'cursorBlink 0.75s step-end infinite' }}
        />
      )}
    </p>
  );
}

/* ─────────────── Error ─────────────── */

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-2">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-nebula-rose/10 ring-1 ring-nebula-rose/30">
        <AlertCircle size={20} className="text-nebula-rose/80" />
      </span>
      <p className="text-center text-sm text-slate-400">
        Could not generate insight. Check your connection or API key.
      </p>
      <button
        onClick={onRetry}
        className="rounded-xl bg-nebula-violet/20 px-4 py-2 text-xs font-semibold text-nebula-violet ring-1 ring-nebula-violet/40 transition-all duration-300 hover:scale-105 hover:bg-nebula-violet/30"
      >
        Try again
      </button>
    </div>
  );
}
