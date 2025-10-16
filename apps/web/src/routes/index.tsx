import { createFileRoute } from "@tanstack/react-router";
import useAppStore from "@/lib/stores/app.store";
import WatchHome from "@/layouts/watch/home";
import ListenHome from "@/layouts/listen/home";
import { requireAuth } from "@/lib/route-guards";

export const Route = createFileRoute("/")({
  component: Index,
  beforeLoad: async () => {
    // Require authentication to view homepage
    await requireAuth();
  },
});

function Index() {
  const { appMode } = useAppStore();
  return (
    <div className="pt-[138px] px-4">
      {appMode === "watch" && <WatchHome />}
      {appMode === "listen" && <ListenHome />}
    </div>
  );
}
