import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hogwarts School Management",
    short_name: "Hogwarts",
    description:
      "A comprehensive school automation platform that manages students, faculty, and academic processes with an intuitive interface",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    orientation: "portrait",
    icons: [
      {
        src: "/logo.png",
        sizes: "any",
        type: "image/png",
      },
    ],
    categories: ["education", "productivity", "business"],
    lang: "en",
    dir: "auto",
  }
}
