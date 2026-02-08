import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: __dirname,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

// Add security headers (CSP) with a relaxed dev policy including
// the known inline script hash reported by the browser, and a
// stricter policy for production.
nextConfig.headers = async () => {
  const devCsp =
    "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' 'inline-speculation-rules' 'sha256-kPx0AsF0oz2kKiZ875xSvv693TBHkQ/0SkMJZnnNpnQ=' https://apis.google.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src * data: blob:; connect-src *;";

  const prodCsp =
    "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' 'inline-speculation-rules' https://apis.google.com https://www.googletagmanager.com; style-src 'self'; img-src 'self' data:; connect-src 'self' https://firebaseinstallations.googleapis.com https://www.google-analytics.com; frame-ancestors 'none';";

  const value = process.env.NODE_ENV === 'production' ? prodCsp : devCsp;

  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value,
        },
      ],
    },
  ];
};

export default nextConfig;
