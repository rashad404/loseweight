import Link from 'next/link';

/**
 * Root-level 404, outside the [lang] tree. It cannot use next-intl's Link or
 * translations because no locale has been resolved at this point, so it is
 * deliberately plain and English.
 */
export default function NotFound() {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          padding: '4rem 1.5rem',
          textAlign: 'center',
          background: '#fbfcfc',
          color: '#131c26',
        }}
      >
        <h1 style={{ fontSize: '1.75rem', margin: 0, letterSpacing: '-0.02em' }}>
          Page not found
        </h1>
        <p style={{ color: '#5e6469', marginTop: '0.75rem' }}>
          The page you asked for does not exist.
        </p>
        <Link
          href="/"
          style={{ color: '#0a7469', marginTop: '1.5rem', display: 'inline-block', fontWeight: 600 }}
        >
          Go to the homepage
        </Link>
      </body>
    </html>
  );
}
