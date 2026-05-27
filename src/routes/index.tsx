import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/components/Dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TubeDeck — YouTube Video Dashboard" },
      { name: "description", content: "Paste YouTube links and organize them in gallery, list or compact views." },
      { property: "og:title", content: "TubeDeck — YouTube Video Dashboard" },
      { property: "og:description", content: "Paste YouTube links and organize them in gallery, list or compact views." },
    ],
  }),
  component: Dashboard,
});
