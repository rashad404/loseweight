'use client';

import { useId, useMemo, useState } from 'react';
import { kgToLb, type Units } from '@/lib/health/units';
import { interpolateProjection, type TrendPoint } from '@/lib/plan/analysis';
import type { SavedPlan } from '@/lib/plan/storage';

const DAY = 86_400_000;
const at = (iso: string) => new Date(`${iso}T00:00:00`).getTime();

/**
 * Raw weigh-ins, the 7 day trend, the planned trajectory and the goal on one
 * set of axes. Hand-rolled SVG rather than a charting library, because page
 * weight matters and this only needs four marks.
 *
 * The `summary` prop is a full text equivalent, so the chart is not information
 * available only to sighted users.
 */
export default function TrendChart({
  points, plan, units, unitLabel, labels,
}: {
  points: TrendPoint[];
  plan: SavedPlan | null;
  units: Units;
  unitLabel: string;
  labels: { raw: string; trend: string; planned: string; goal: string; summary: string };
}) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);

  const W = 760;
  const H = 320;
  const pad = { top: 16, right: 18, bottom: 38, left: 52 };

  const toDisplay = (kg: number) => (units === 'metric' ? kg : kgToLb(kg));

  const geo = useMemo(() => {
    if (points.length === 0) return null;

    const t0 = at(points[0].date);
    const tEnd = at(points[points.length - 1].date);
    const spanDays = Math.max((tEnd - t0) / DAY, 1);

    const planned = plan
      ? points.map((p) => ({
          date: p.date,
          weight: toDisplay(
            interpolateProjection(plan.projection, (at(p.date) - at(plan.startedOn)) / (7 * DAY)),
          ),
        }))
      : [];

    const goal = plan ? toDisplay(plan.goalWeightKg) : null;

    const values = [
      ...points.map((p) => toDisplay(p.weightKg)),
      ...points.map((p) => toDisplay(p.averageKg)),
      ...planned.map((p) => p.weight),
      ...(goal !== null ? [goal] : []),
    ];
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const padY = Math.max((hi - lo) * 0.12, 0.6);

    const x = (date: string) => pad.left + ((at(date) - t0) / DAY / spanDays) * (W - pad.left - pad.right);
    const y = (v: number) => pad.top + ((hi + padY - v) / (hi + padY - (lo - padY))) * (H - pad.top - pad.bottom);

    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => lo - padY + f * (hi + padY - (lo - padY)));
    const dateTicks = [0, 0.5, 1].map((f) => points[Math.round(f * (points.length - 1))].date);

    return { x, y, ticks, dateTicks, planned, goal };
  }, [points, plan, units]);

  if (!geo) return null;

  const { x, y, ticks, dateTicks, planned, goal } = geo;
  const line = (pts: { date: string; weight: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.date).toFixed(1)} ${y(p.weight).toFixed(1)}`).join(' ');

  const trendPts = points.map((p) => ({ date: p.date, weight: toDisplay(p.averageKg) }));
  const hovered = hover !== null ? points[hover] : null;

  const legend = [
    { label: labels.trend, color: 'var(--color-brand-600)', dashed: false },
    { label: labels.raw, color: 'var(--text-muted)', dashed: false, faint: true },
    ...(plan ? [{ label: labels.planned, color: 'var(--color-violet-500)', dashed: true }] : []),
    ...(goal !== null ? [{ label: labels.goal, color: 'var(--color-clay)', dashed: true }] : []),
  ];

  return (
    <section className="pt-6 border-t border-line">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label={labels.summary}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          let best = 0;
          let bestD = Infinity;
          points.forEach((p, i) => {
            const d = Math.abs(x(p.date) - px);
            if (d < bestD) { bestD = d; best = i; }
          });
          setHover(best);
        }}
      >
        {ticks.map((v, i) => (
          <g key={i}>
            <line x1={pad.left} x2={W - pad.right} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth={1} />
            <text x={pad.left - 8} y={y(v) + 4} textAnchor="end" fontSize={11} fill="var(--text-muted)">
              {v.toFixed(1)}
            </text>
          </g>
        ))}

        <text x={pad.left - 8} y={pad.top - 4} textAnchor="end" fontSize={10} fill="var(--text-muted)">
          {unitLabel}
        </text>

        {dateTicks.map((d) => (
          <text key={d} x={x(d)} y={H - 14} textAnchor="middle" fontSize={11} fill="var(--text-muted)">
            {d.slice(5)}
          </text>
        ))}

        {goal !== null && (
          <>
            <line x1={pad.left} x2={W - pad.right} y1={y(goal)} y2={y(goal)}
              stroke="var(--color-clay)" strokeWidth={1.5} strokeDasharray="6 4" />
            <text x={W - pad.right} y={y(goal) - 6} textAnchor="end" fontSize={11}
              fill="var(--color-clay)" fontWeight={600}>
              {labels.goal}
            </text>
          </>
        )}

        {planned.length > 0 && (
          <path d={line(planned)} fill="none" stroke="var(--color-violet-500)"
            strokeWidth={2} strokeDasharray="7 5" strokeLinecap="round" />
        )}

        {/* Raw observations sit behind the trend: they are context, not the signal. */}
        {points.map((p) => (
          <circle key={p.date} cx={x(p.date)} cy={y(toDisplay(p.weightKg))} r={2.5}
            fill="var(--text-muted)" opacity={0.45} />
        ))}

        <defs>
          <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity={0.16} />
            <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={`${line(trendPts)} L ${x(points[points.length - 1].date)} ${H - pad.bottom} L ${x(points[0].date)} ${H - pad.bottom} Z`}
          fill={`url(#${id}-fill)`} />
        <path d={line(trendPts)} fill="none" stroke="var(--color-brand-600)" strokeWidth={2.5}
          strokeLinecap="round" strokeLinejoin="round" />

        {hovered && (
          <>
            <line x1={x(hovered.date)} x2={x(hovered.date)} y1={pad.top} y2={H - pad.bottom}
              stroke="var(--text-muted)" strokeWidth={1} strokeDasharray="3 3" />
            <circle cx={x(hovered.date)} cy={y(toDisplay(hovered.averageKg))} r={4.5}
              fill="var(--color-brand-600)" stroke="var(--raised)" strokeWidth={2} />
          </>
        )}
      </svg>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        {legend.map((l) => (
          <span key={l.label} className="inline-flex items-center gap-2">
            <span className="inline-block h-0.5 w-6 rounded" style={{
              background: l.dashed
                ? `repeating-linear-gradient(90deg, ${l.color} 0 5px, transparent 5px 9px)`
                : l.color,
              opacity: l.faint ? 0.5 : 1,
            }} />
            <span className="text-muted">{l.label}</span>
          </span>
        ))}
      </div>

      {hovered && (
        <p className="mt-2 text-[0.875rem]">
          <span className="font-semibold">{hovered.date}</span>
          <span className="ml-3 text-muted">
            {labels.trend}: {toDisplay(hovered.averageKg).toFixed(1)} {unitLabel}
          </span>
          <span className="ml-3 text-muted">
            {labels.raw}: {toDisplay(hovered.weightKg).toFixed(1)} {unitLabel}
          </span>
        </p>
      )}

      <p className="sr-only">{labels.summary}</p>
    </section>
  );
}
