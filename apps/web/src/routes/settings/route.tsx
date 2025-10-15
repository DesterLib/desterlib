import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { CogIcon, LibraryIcon, VideoIcon } from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="pt-[138px] px-4 max-w-7xl mx-auto flex gap-4 h-[calc(100vh-138px)]">
      <nav className="max-w-sm w-full bg-white/10 backdrop-blur-lg rounded-xl p-2 space-y-2">
        <span className="flex items-center gap-2 p-4">
          <CogIcon className="size-5" />
          <h2 className="text-2xl font-bold">Settings</h2>
        </span>
        <Link
          className="flex items-center gap-2 hover:bg-white/10 rounded-xl px-4 h-12 text-sm text-white transition focus-visible:outline-2"
          to="/settings/libraries"
        >
          <div className="h-8 w-8 bg-gray-300 text-gray-700 rounded-full flex items-center justify-center">
            <LibraryIcon className="size-4" />
          </div>
          <span>Libraries</span>
        </Link>
        <Link
          className="flex items-center gap-2 hover:bg-white/10 rounded-xl px-4 h-12 text-sm text-white transition focus-visible:outline-2"
          to="/settings/libraries"
        >
          <div className="h-8 w-8 bg-gray-300 text-gray-700 rounded-full flex items-center justify-center">
            <VideoIcon className="size-4" />
          </div>
          <span>Video Player</span>
        </Link>
      </nav>
      <div className="flex-1 w-full px-16 2xl:p-16">
        <Outlet />
      </div>
    </div>
  );
}
