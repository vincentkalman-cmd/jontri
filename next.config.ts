import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.jontri.com" }],
        destination: "https://jontri.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
