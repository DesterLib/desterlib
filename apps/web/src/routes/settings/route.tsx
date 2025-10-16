import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import {
  LibraryIcon,
  VideoIcon,
  ActivityIcon,
  Edit,
  Menu,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
  beforeLoad: ({ location }) => {
    // If we're at the exact settings route, redirect to libraries
    if (location.pathname === "/settings") {
      throw redirect({ to: "/settings/libraries" });
    }
  },
});

function RouteComponent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "ADMIN";

  // Redirect unauthenticated users or guests
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role === "GUEST")) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, user?.role, isLoading, navigate]);

  return (
    <div className="pt-[138px] px-4 max-w-7xl mx-auto flex gap-4 h-[calc(100vh-138px)]">
      <nav className="max-w-sm w-full space-y-6">
        {/* User Profile Section */}
        <div className="bg-neutral-900/60 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-white">
              {user?.username || "User"}
            </h1>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                className="border-none hover:bg-white/10"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="border-none hover:bg-white/10"
              >
                <Menu className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-white/60">
            {user?.role} • {user?.email}
          </p>
        </div>

        {/* Settings Section */}
        <div className="bg-neutral-900/60 backdrop-blur-sm border border-white/10 rounded-2xl p-4 space-y-4">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          {/* Settings Navigation */}
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full border-none justify-start gap-3 px-3 py-2 h-10 text-sm text-white hover:bg-white/10"
              asChild
            >
              <Link to="/settings/libraries">
                <LibraryIcon className="w-4 h-4" />
                <span>Libraries</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="w-full border-none justify-start gap-3 px-3 py-2 h-10 text-sm text-white hover:bg-white/10"
              asChild
            >
              <Link to="/settings/libraries">
                <VideoIcon className="w-4 h-4" />
                <span>Video Player</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Admin-only settings */}
        {isAdmin && (
          <div className="bg-neutral-900/60 backdrop-blur-sm border border-white/10 rounded-2xl p-4 space-y-4">
            <h2 className="text-lg font-semibold text-white">Admin</h2>
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full border-none justify-start gap-3 px-3 py-2 h-10 text-sm text-white hover:bg-white/10"
                asChild
              >
                <Link to="/settings/users">
                  <Users className="w-4 h-4" />
                  <span>User Management</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full border-none justify-start gap-3 px-3 py-2 h-10 text-sm text-white hover:bg-white/10"
                asChild
              >
                <Link to="/settings/system">
                  <ActivityIcon className="w-4 h-4" />
                  <span>System & Monitoring</span>
                </Link>
              </Button>
            </div>
          </div>
        )}
      </nav>
      <div className="flex-1 w-full px-16 2xl:p-16">
        <Outlet />
      </div>
    </div>
  );
}
