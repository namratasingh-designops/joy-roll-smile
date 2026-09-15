import { createFileRoute } from "@tanstack/react-router";
import LudoApp from "@/components/LudoApp";

const TITLE = "Ludo Game for Kids — Free Fun Game for Ages 5–7";
const DESCRIPTION =
  "A free ludo game for kids aged 5 to 7. A fun, educational game with big buttons, spoken instructions and counting practice — no reading needed, no ads.";
const URL = "https://joy-roll-smile.lovable.app/";

export const Route = createFileRoute("/")({
  ssr: false, // the 3D canvas and audio are browser only
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "VideoGame",
          name: "Ludo: Play, Learn, Smile",
          description: DESCRIPTION,
          url: URL,
          applicationCategory: "GameApplication",
          genre: ["Board game", "Educational game for kids"],
          typicalAgeRange: "5-7",
          gamePlatform: "Web browser",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }),
      },
    ],
  }),
  component: LudoApp,
});
