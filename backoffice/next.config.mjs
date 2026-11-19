/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const apiDest =
      process.env.BACKEND_API_URL ||
      process.env.NEXT_PUBLIC_URL_API ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8000/api";
    return [
      {
        source: "/api/:path*",
        destination: apiDest.endsWith("/") ? `${apiDest}:path*` : `${apiDest}/:path*`,
      },
    ];
  },
};

export default nextConfig;
