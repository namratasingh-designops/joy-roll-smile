import { createFileRoute, useHydrated } from "@tanstack/react-router";
import { Suspense, lazy } from "react";

const LudoApp = lazy(() => import("@/components/LudoApp"));

const TITLE = "Ludo Game for Kids — Free Fun Game for Ages 5–7";
const DESCRIPTION =
  "A free ludo game for kids aged 5 to 7. A fun, educational game with big buttons, spoken instructions and counting practice — no reading needed, no ads.";
const URL = "https://joy-roll-smile.lovable.app/";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
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
  component: Home,
});

/**
 * The game itself (3D board, audio, speech) is browser only, so it loads after
 * hydration. Until then we render the real page intro, which is what search
 * engines and link previews read.
 */
function Intro() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-panel px-6 py-10 text-ink">
      <h1 className="max-w-2xl text-center font-display text-3xl">
        Ludo: Play, Learn, Smile — a fun ludo game for kids aged 5 to 7
      </h1>
      <p className="max-w-2xl text-center text-lg text-ink/70">
        Free and easy to play on your own: a chunky 3D board, big buttons, spoken instructions and
        counting practice with Leo the lion. No reading needed, no ads.
      </p>
      <p className="max-w-2xl text-center text-lg text-ink/70">
        Play with computer buddies or with family, taking turns on one device. Roll the glowing dice,
        count the hops out loud, race your pieces home and collect stickers.
      </p>
      <p aria-live="polite" className="font-display text-xl">
        Loading the playroom…
      </p>
    </main>
  );
}

function Home() {
  const hydrated = useHydrated();
  if (!hydrated) return <Intro />;
  return (
    <Suspense fallback={<Intro />}>
      <LudoApp />
    </Suspense>
  );
}
