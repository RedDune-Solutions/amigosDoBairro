import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Os Amigos do Bairro",
    short_name: "Amigos do Bairro",
    description:
      "Clube de fidelização do Café & Snack-Bar — pontos, recompensas e reservas.",
    start_url: "/app",
    display: "standalone",
    background_color: "#f7efe1",
    theme_color: "#f7efe1",
    lang: "pt-PT",
    icons: [
      { src: "/icon-any.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
