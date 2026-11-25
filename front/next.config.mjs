/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  allowedDevOrigins: ["192.168.1.121"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-d002e5c7c2014303ac735f9e3a54f8f4.r2.dev",
      },
      {
        protocol: "https",
        hostname: "i.pinimg.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;