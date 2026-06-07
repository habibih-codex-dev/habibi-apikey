/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Full-stack app: the API lives in app/api/* (Next.js Route Handlers) and
  // deploys as serverless functions on Vercel. The frontend calls them with
  // relative URLs, so no separate backend host is needed.
  env: {
    // Leave blank to use same-origin (/api/...). Only set this if the dashboard
    // and API are hosted separately.
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
  },
};

module.exports = nextConfig;
