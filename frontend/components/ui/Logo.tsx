import Image from 'next/image';

/**
 * The logo ships as two files because the wordmark is near-black and would
 * disappear on a dark background. Both are rendered and swapped with CSS rather
 * than JavaScript, so the correct one is present in the first paint and there
 * is no flash when the theme is read from localStorage.
 *
 * `variant="onDark"` is for surfaces that are dark in both themes, such as the
 * footer and hero band, where the theme-reactive swap would pick the wrong one.
 */
export default function Logo({
  height = 30,
  variant = 'auto',
  priority = false,
  className = '',
}: {
  height?: number;
  variant?: 'auto' | 'onDark';
  priority?: boolean;
  className?: string;
}) {
  // Intrinsic aspect ratio of the trimmed lockup, 1200 x 179.
  const width = Math.round((height * 1200) / 179);
  const alt = 'LoseWeight.net';

  if (variant === 'onDark') {
    return (
      <Image
        src="/brand/logo-dark.png"
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={className}
        style={{ height, width: 'auto' }}
      />
    );
  }

  return (
    <>
      <Image
        src="/brand/logo.png"
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={`block dark:hidden ${className}`}
        style={{ height, width: 'auto' }}
      />
      <Image
        src="/brand/logo-dark.png"
        alt=""
        aria-hidden="true"
        width={width}
        height={height}
        priority={priority}
        className={`hidden dark:block ${className}`}
        style={{ height, width: 'auto' }}
      />
    </>
  );
}
