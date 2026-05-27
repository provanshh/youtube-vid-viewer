import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/components/Dashboard";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "TubeDeck — Dashboard" },
      { name: "description", content: "Your YouTube video dashboard." },
    ],
  }),
  component: Dashboard,
});
