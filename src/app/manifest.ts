import type { MetadataRoute } from "next";

// Tells phones how to install the site as an app (name, icon, full screen).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Penny: Budget Notebook",
    short_name: "Penny",
    description: "A money notebook that doesn’t judge you",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f3ecdd",
    theme_color: "#4d6f9c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
