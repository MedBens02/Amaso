// The app has no route handlers, middleware, server actions or dynamic
// route segments, so a production build can be exported as plain static
// files. Set BUILD_STATIC=1 and `next build` writes ./out, which nginx
// serves directly - no Node process in production, and the API proxying
// below is done by nginx instead. Left off for `next dev`, where the
// rewrite is what lets the browser call /api on the dev server.
const staticExport = process.env.BUILD_STATIC === '1'

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(staticExport ? { output: 'export' } : {}),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*', // Proxy to Laravel backend
      },
    ]
  },
}

export default nextConfig
