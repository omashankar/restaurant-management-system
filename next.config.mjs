/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  devIndicators: false,
  experimental: {
    // Allow multipart uploads up to 8MB (menu/CMS images are capped at 5MB server-side).
    proxyClientMaxBodySize: "8mb",
  },
  images: {
    // Default: optimized images in production. Set NEXT_IMAGE_UNOPTIMIZED=1 for ngrok/tunnel dev.
    unoptimized: process.env.NEXT_IMAGE_UNOPTIMIZED === "1",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  // PWA headers
  async headers() {
    return [
      {
        source: "/manifest.json",
        headers: [{ key: "Content-Type", value: "application/manifest+json" }],
      },
    ];
  },
};

export default nextConfig;