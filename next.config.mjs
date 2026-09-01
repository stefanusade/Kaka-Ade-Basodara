/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cms.kakaadebasodara.com",
      },
    ],
  },
};

export default nextConfig;
