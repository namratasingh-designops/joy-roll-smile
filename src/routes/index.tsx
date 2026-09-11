import { createFileRoute } from "@tanstack/react-router";
import LudoApp from "@/components/LudoApp";

export const Route = createFileRoute("/")({
  ssr: false, // the 3D canvas and audio are browser only
  head: () => ({
    meta: [
      { title: "Ludo: Play, Learn, Smile — a friendly Ludo game for ages 5–7" },
      {
        name: "description",
        content:
          "A cosy 3D Ludo game for children aged 5 to 7. Big buttons, spoken instructions, counting practice and a friendly lion called Leo.",
      },
      { property: "og:title", content: "Ludo: Play, Learn, Smile" },
      {
        property: "og:description",
        content:
          "A gentle 3D Ludo game for young children: tap the dice, count the hops, everyone gets a medal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LudoApp,
});
