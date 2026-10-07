import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // `next dev` only serves its scripts and hot reload to localhost. Allow
  // Cloudflare quick tunnels (random *.trycloudflare.com names) so the dev
  // site can be previewed on a phone. Dev only; production ignores it.
  allowedDevOrigins: ["*.trycloudflare.com"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "foxivehwqliehofhwsrd.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
