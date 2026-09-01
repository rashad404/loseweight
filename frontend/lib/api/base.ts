/** Base URL for the Laravel API. Kept dependency free so tests can import it. */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8044/api';
