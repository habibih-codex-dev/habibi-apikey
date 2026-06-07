/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Full-stack app: the API lives in app/api/* (Next.js Route Handlers) and
  // deploys as serverless functions on Vercel. The frontend calls them with
  // relative URLs, so no separate backend host is needed.
  //
  // @napi-rs/canvas is a NATIVE module — it must NOT be bundled by webpack,
  // otherwise its .node binary fails to load on Vercel ("canvas not available").
  // Marking it external makes Next load it from node_modules at runtime.
  experimental: {
    serverComponentsExternalPackages: ['@napi-rs/canvas'],
  },
  env: {
    // Leave blank to use same-origin (/api/...). Only set this if the dashboard
    // and API are hosted separately.
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
  },
};

module.exports = nextConfig;
