'use client';

import { useId, useMemo, useState } from 'react';

export interface Series {
  label: string;
  color: string;
  dashed?: boolean;
  points: { week: number; weight: number }[];
}

interface Props {
  series: Series[];
  goalWeight: number;
  goalLabel: string;
  unitSuffix: string;
  weekLabel: (week: number) => string;
  formatWeight: (kg: number) => string;
}

/**
 * A small dependency-free SVG chart. A charting library would add well over
 * 100 KB to a page whose whole point is loading fast for search traffic, and
 * this only ever needs two lines and a threshold.
 */
export default function ProjectionChart({
  series,
  goalWeight,
  goalLabel,
  unitSuffix,
  weekLabel,
  formatWeight,
}: Props) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);

  const W = 760;
  const H = 300;
  const pad = { top: 16, right: 16, bottom: 34, left: 46 };

  const geometry = useMemo(() => {
    const all = series.flatMap((s) => s.points);
    if (all.length === 0) return null;

    const maxWeek = Math.max(...all.map((p) => p.week), 1);
    const weights = [...all.map((p) => p.weight), goalWeight];
    const rawMin = Math.min(...weights);
    const rawMax = Math.max(...weights);
    const padding = Math.max((rawMax - rawMin) * 0.12, 1);
    const minY = rawMin - padding;
    const maxY = rawMax + padding;

    const x = (week: number) =>
      pad.left + (week / maxWeek) * (W - pad.left - pad.right);
    const y = (weight: number) =>
      pad.top + ((maxY - weight) / (maxY - minY)) * (H - pad.top - pad.bottom);

    // Roughly five ticks, snapped to whole weeks.
    const weekStep = Math.max(1, Math.ceil(maxWeek / 5));
    const weekTicks = [];
    for (let w = 0; w <= maxWeek; w += weekStep) weekTicks.push(w);

    const weightTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => minY + f * (maxY - minY));

    return { maxWeek, minY, maxY, x, y, weekTicks, weightTicks };
  }, [series, goalWeight]);

  if (!geometry) return null;

  const { maxWeek, x, y, weekTicks, weightTicks } = geometry;
  const primary = series[0];

  const hoveredPoints =
    hover === null
      ? null
      : series.map((s) => {
          const nearest = s.points.reduce((best, p) =>
            Math.abs(p.week - hover) < Math.abs(best.week - hover) ? p : best,
          );
          return { label: s.label, color: s.color, point: nearest };
        });

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`${goalLabel} ${formatWeight(goalWeight)}`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - rect.left) / rect.width) * W;
          const week = Math.round(
            ((px - pad.left) / (W - pad.left - pad.right)) * maxWeek,
          );
          setHover(Math.max(0, Math.min(maxWeek, week)));
        }}
      >
        {weightTicks.map((value, i) => (
          <g key={i}>
            <line
              x1={pad.left}
              x2={W - pad.right}
              y1={y(value)}
              y2={y(value)}
              stroke="var(--line)"
              strokeWidth={1}
            />
            <text
              x={pad.left - 8}
              y={y(value) + 4}
              textAnchor="end"
              fontSize={11}
              fill="var(--text-muted)"
            >
              {Math.round(value)}
            </text>
          </g>
        ))}

        {weekTicks.map((week) => (
          <text
            key={week}
            x={x(week)}
            y={H - 12}
            textAnchor="middle"
            fontSize={11}
            fill="var(--text-muted)"
          >
            {week}
          </text>
        ))}

        <line
          x1={pad.left}
          x2={W - pad.right}
          y1={y(goalWeight)}
          y2={y(goalWeight)}
          stroke="var(--color-clay)"
          strokeWidth={1.5}
          strokeDasharray="5 4"
        />
        <text
          x={W - pad.right}
          y={y(goalWeight) - 6}
          textAnchor="end"
          fontSize={11}
          fill="var(--color-clay)"
          fontWeight={600}
        >
          {goalLabel} {formatWeight(goalWeight)}
        </text>

        {series.map((s, si) => {
          const path = s.points
            .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.week)} ${y(p.weight)}`)
            .join(' ');
          const areaPath =
            si === 0
              ? `${path} L ${x(s.points[s.points.length - 1].week)} ${H - pad.bottom} L ${x(s.points[0].week)} ${H - pad.bottom} Z`
              : null;

          return (
            <g key={s.label}>
              {areaPath && (
                <>
                  <defs>
                    <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={s.color} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <path d={areaPath} fill={`url(#${id}-fill)`} />
                </>
              )}
              <path
                d={path}
                fill="none"
                stroke={s.color}
                strokeWidth={si === 0 ? 2.5 : 1.75}
                strokeDasharray={s.dashed ? '6 5' : undefined}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          );
        })}

        {hover !== null && hoveredPoints && (
          <>
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={pad.top}
              y2={H - pad.bottom}
              stroke="var(--text-muted)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            {hoveredPoints.map((h) => (
              <circle
                key={h.label}
                cx={x(h.point.week)}
                cy={y(h.point.weight)}
                r={4}
                fill={h.color}
                stroke="var(--paper)"
                strokeWidth={2}
              />
            ))}
          </>
        )}
      </svg>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        {series.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-2">
            <span
              className="inline-block h-0.5 w-6 rounded"
              style={{
                background: s.dashed
                  ? `repeating-linear-gradient(90deg, ${s.color} 0 5px, transparent 5px 9px)`
                  : s.color,
              }}
            />
            <span className="text-muted">{s.label}</span>
          </span>
        ))}
      </div>

      {hover !== null && hoveredPoints && (
        <div className="mt-2 text-sm">
          <span className="font-semibold">{weekLabel(hoveredPoints[0].point.week)}</span>
          {hoveredPoints.map((h) => (
            <span key={h.label} className="ml-4 text-muted">
              <span style={{ color: h.color }}>{h.label}:</span>{' '}
              {formatWeight(h.point.weight)} {unitSuffix}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
