import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Everything except API routes, Next internals, the admin panel and static files.
  matcher: ['/((?!api|admin|_next|_vercel|.*\\..*).*)'],
};
