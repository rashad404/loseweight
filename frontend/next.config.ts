import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: '100.89.150.50', port: '8044', pathname: '/storage/**' },
      { protocol: 'https', hostname: 'api.loseweight.net', pathname: '/storage/**' },
    ],
  },
};

export default withNextIntl(nextConfig);
