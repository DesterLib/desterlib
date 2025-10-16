import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/route-guards";

export const Route = createFileRoute("/library/")({
  component: RouteComponent,
  beforeLoad: async () => {
    // Require authentication to view library
    await requireAuth();
  },
});

function RouteComponent() {
  return <div>Hello "/library/"!</div>;
}
