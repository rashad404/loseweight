export default function NotFound() {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Page not found</h1>
        <p style={{ color: '#67768b', marginTop: '0.75rem' }}>
          The page you asked for does not exist.
        </p>
        <a href="/en" style={{ color: '#128762', marginTop: '1.5rem', display: 'inline-block' }}>
          Go to the homepage
        </a>
      </body>
    </html>
  );
}
