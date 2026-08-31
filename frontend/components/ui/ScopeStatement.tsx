import { scopeFor } from '@/content/policies/scope';

/**
 * Renders the canonical scope statement. Used by the policy pages and by
 * onboarding consent so the wording cannot drift between them.
 */
export default function ScopeStatement({
  lang,
  variant = 'full',
}: {
  lang: string;
  variant?: 'full' | 'statement';
}) {
  const s = scopeFor(lang);

  if (variant === 'statement') {
    return <p className="text-[0.9375rem] leading-relaxed">{s.statement}</p>;
  }

  return (
    <>
      <p>{s.statement}</p>

      <h3>{s.providesTitle}</h3>
      <ul>
        {s.provides.map((line) => <li key={line}>{line}</li>)}
      </ul>

      <h3>{s.excludesTitle}</h3>
      <ul>
        {s.excludes.map((line) => <li key={line}>{line}</li>)}
      </ul>

      <p>{s.blockedNote}</p>
    </>
  );
}
