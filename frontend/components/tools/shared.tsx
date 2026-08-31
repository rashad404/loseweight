'use client';

import { useId, type ReactNode } from 'react';

/**
 * A real label bound to a real control.
 *
 * The previous version rendered `<span class="field-label">`, which looks
 * identical and is invisible to assistive technology. Every tool used it, so
 * the tracker alone shipped five unlabeled inputs. This clones the child to
 * inject the generated id, plus aria-describedby when there is a hint, so a
 * screen reader announces the label and the help text together.
 */
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: (props: {
    id: string;
    'aria-describedby'?: string;
    'aria-invalid'?: true;
  }) => ReactNode;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>

      {children({
        id,
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
        ...(error ? { 'aria-invalid': true as const } : {}),
      })}

      {hint && (
        <p id={hintId} className="mt-1.5 text-xs text-muted leading-relaxed">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium" style={{ color: 'var(--color-clay)' }}>
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * A group of radio-like buttons. Uses a fieldset and legend because a segmented
 * control is a choice between options, not a labeled input.
 */
export function FieldGroup({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <fieldset>
      <legend className="field-label">{label}</legend>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted leading-relaxed">{hint}</p>}
    </fieldset>
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
  const color = tone === 'brand' ? 'text-brand-800' : tone === 'warn' ? 'text-clay' : '';

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

export function ScaleBar({
  value, min, max, stops, valueLabel,
}: {
  value: number;
  min: number;
  max: number;
  stops: { at: number; label: string; color: string }[];
  /** Text equivalent, so the band is not conveyed by color alone. */
  valueLabel?: string;
}) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div className="mt-4">
      <div className="relative h-2.5 rounded-full overflow-hidden flex" aria-hidden="true">
        {stops.map((stop, i) => {
          const start = i === 0 ? min : stops[i - 1].at;
          return (
            <div
              key={stop.label}
              style={{ width: `${((stop.at - start) / (max - min)) * 100}%`, background: stop.color }}
            />
          );
        })}
      </div>
      <div className="relative h-6" aria-hidden="true">
        <div className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left: `${pct}%` }}>
          <div className="w-0.5 h-2 bg-current" />
          <span className="text-xs font-bold whitespace-nowrap">{value.toFixed(1)}</span>
        </div>
      </div>
      {valueLabel && <p className="sr-only">{valueLabel}</p>}
    </div>
  );
}
