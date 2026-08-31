import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  /**
   * English moved from /en to the root. next-intl's middleware already
   * redirects, but it answers 307. These URLs were publicly live and listed in
   * the sitemap, so they need a permanent redirect to consolidate the ranking
   * signal. Config redirects run before middleware, so these win.
   */
  async redirects() {
    return [
      { source: '/en', destination: '/', permanent: true },
      { source: '/en/:path*', destination: '/:path*', permanent: true },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: 'http', hostname: '100.89.150.50', port: '8044', pathname: '/storage/**' },
      { protocol: 'https', hostname: 'api.loseweight.net', pathname: '/storage/**' },
    ],
  },
};

export default withNextIntl(nextConfig);
