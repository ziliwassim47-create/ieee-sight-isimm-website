/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sight-isimm.ieee.tn",
      },
    ],
  },
}

export default nextConfig
