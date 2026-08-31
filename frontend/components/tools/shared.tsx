'use client';

import type { ReactNode } from 'react';

export function Field({
  label, hint, children,
}: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <span className="field-label">{label}</span>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted leading-relaxed">{hint}</p>}
    </div>
  );
}

export function ResultCard({
  label, value, unit, note, tone = 'brand',
}: {
  label: string;
  value: string;
  unit?: string;
  note?: string;
  tone?: 'brand' | 'neutral' | 'warn';
}) {
  const color =
    tone === 'brand' ? 'text-brand-600' : tone === 'warn' ? 'text-clay' : '';

  return (
    <div className="panel p-5">
      <div className="text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-muted">
        {label}
      </div>
      <div className={`mt-2 t-num text-[2rem] ${color}`}>
        {value}
        {unit && <span className="ml-1.5 text-[0.9375rem] font-semibold text-muted">{unit}</span>}
      </div>
      {note && <p className="mt-3 text-[0.875rem] text-muted leading-relaxed">{note}</p>}
    </div>
  );
}

export function FormulaNote({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="panel p-4 mt-6">
      <summary className="text-sm font-semibold cursor-pointer">{title}</summary>
      <div className="mt-3 text-sm text-muted leading-relaxed space-y-2">{children}</div>
    </details>
  );
}

/** Horizontal bar showing where a value sits between category boundaries. */
export function ScaleBar({
  value, min, max, stops,
}: {
  value: number;
  min: number;
  max: number;
  stops: { at: number; label: string; color: string }[];
}) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div className="mt-4">
      <div className="relative h-2.5 rounded-full overflow-hidden flex">
        {stops.map((stop, i) => {
          const start = i === 0 ? min : stops[i - 1].at;
          const width = ((stop.at - start) / (max - min)) * 100;
          return (
            <div key={stop.label} style={{ width: `${width}%`, background: stop.color }} />
          );
        })}
      </div>
      <div className="relative h-6">
        <div
          className="absolute -translate-x-1/2 flex flex-col items-center"
          style={{ left: `${pct}%` }}
        >
          <div className="w-0.5 h-2 bg-current" />
          <span className="text-xs font-bold whitespace-nowrap">{value.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}
