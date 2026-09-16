import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sndyy, Fahrell Sandy",
    short_name: "Sndyy",
    description: "Portfolio of Fahrell Sandy, website enthusiast and frontend-focused software engineer.",
    start_url: "/",
    display: "standalone",
    background_color: "#fcfcfa",
    theme_color: "#f1f0ec",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
