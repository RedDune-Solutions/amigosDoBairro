import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Os Amigos do Bairro",
    short_name: "Amigos do Bairro",
    description:
      "Clube de fidelização do Café & Snack-Bar do Bairro — pontos, recompensas e reservas.",
    start_url: "/app",
    display: "standalone",
    background_color: "#f7efe1",
    theme_color: "#f7efe1",
    lang: "pt-PT",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      {
        src: "/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
