export default function ProgressLandscape({ ratio, enabled }: { ratio: number; enabled: boolean }) {
  if (!enabled) return null;
  const sun = 18 + ratio * 54;
  return (
    <div className="game-landscape" aria-hidden="true">
      <span className="game-orb" style={{ left: `${sun}%` }} />
      <span className="game-cloud game-cloud-one" />
      <span className="game-cloud game-cloud-two" />
      <span className="game-hill game-hill-back" />
      <span className="game-hill game-hill-front" />
      <span className="game-path" style={{ transform: `scaleX(${Math.max(0.12, ratio)})` }} />
    </div>
  );
}
