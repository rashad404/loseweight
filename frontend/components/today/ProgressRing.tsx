export default function ProgressRing({ completed, planned }: { completed: number; planned: number }) {
  const ratio = planned ? completed / planned : 0;
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative size-32 shrink-0" role="img" aria-label={`${completed} of ${planned} planned actions completed`}>
      <svg viewBox="0 0 120 120" className="-rotate-90 size-full">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--line)" strokeWidth="10" />
        <circle cx="60" cy="60" r={radius} fill="none" stroke="url(#momentum)" strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - ratio)}
          className="transition-[stroke-dashoffset] duration-500" />
        <defs><linearGradient id="momentum"><stop stopColor="#0bd3bf" /><stop offset="1" stopColor="#6353e9" /></linearGradient></defs>
      </svg>
      <span className="absolute inset-0 grid place-content-center text-center">
        <strong className="t-num text-2xl">{completed}/{planned}</strong>
        <small className="text-[0.65rem] uppercase tracking-wider text-muted">7 days</small>
      </span>
    </div>
  );
}
