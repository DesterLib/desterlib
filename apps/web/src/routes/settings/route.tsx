import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
  useLocation,
} from "@tanstack/react-router";
import {
  LibraryIcon,
  VideoIcon,
  ActivityIcon,
  Edit,
  Users,
  Star,
  Shield,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { blockGuests } from "@/lib/route-guards";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
  beforeLoad: async ({ location }) => {
    // Require authenticated user (block guests) - redirects to login if not authenticated
    await blockGuests();

    // If we're at the exact settings route, redirect to libraries
    if (location.pathname === "/settings") {
      throw redirect({ to: "/settings/libraries" });
    }
  },
});

function RouteComponent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  // Define navigation items
  const navItems = useMemo(() => {
    const baseItems = [
      {
        id: "libraries",
        label: "Libraries",
        href: "/settings/libraries",
        icon: LibraryIcon,
      },
      {
        id: "video",
        label: "Video Player",
        href: "/settings/libraries",
        icon: VideoIcon,
      },
    ];

    const adminItems = isAdmin
      ? [
          {
            id: "users",
            label: "User Management",
            href: "/settings/users",
            icon: Users,
          },
          {
            id: "system",
            label: "System & Monitoring",
            href: "/settings/system",
            icon: ActivityIcon,
          },
        ]
      : [];

    return [...baseItems, ...adminItems];
  }, [isAdmin]);

  // Get active tab based on current path
  const activeTab = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith("/settings/users")) return "users";
    if (path.startsWith("/settings/system")) return "system";
    return "libraries";
  }, [location.pathname]);

  // Redirect unauthenticated users or guests
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role === "GUEST")) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, user?.role, isLoading, navigate]);

  return (
    <div className="pt-4 md:pt-[138px] md:px-4 max-w-7xl mx-auto flex flex-col md:flex-row gap-4 pb-20 md:pb-0 md:h-[calc(100vh-138px)]">
      {/* Desktop Sidebar - Hidden on mobile */}
      <nav className="hidden md:block max-w-sm w-full space-y-6">
        {/* User Profile Section - Desktop Horizontal */}
        <div className="flex items-center gap-4 px-2 py-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
            <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform border-2 border-background">
              <Edit className="w-3 h-3 text-black" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">
              {user?.username || "User"}
            </h1>
            <p className="text-sm text-white/60 truncate mb-2">{user?.email}</p>
            <Badge
              variant={
                user?.role === "SUPER_ADMIN"
                  ? "default"
                  : user?.role === "ADMIN"
                    ? "secondary"
                    : "outline"
              }
              className={`inline-flex items-center gap-1 ${
                user?.role === "SUPER_ADMIN"
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  : user?.role === "ADMIN"
                    ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                    : "bg-blue-500/20 text-blue-300 border-blue-500/30"
              }`}
            >
              {user?.role === "SUPER_ADMIN" && (
                <Star className="w-3 h-3 fill-amber-300" />
              )}
              {user?.role === "ADMIN" && <Shield className="w-3 h-3" />}
              {user?.role === "SUPER_ADMIN"
                ? "Super Admin"
                : user?.role === "ADMIN"
                  ? "Admin"
                  : user?.role === "GUEST"
                    ? "Guest"
                    : "User"}
            </Badge>
          </div>
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

      {/* Mobile Content Container */}
      <div className="flex-1 flex flex-col md:w-full md:overflow-hidden">
        {/* Mobile Horizontal Navigation - Visible only on mobile */}
        <div className="md:hidden px-4 pb-3">
          {/* User Profile Section - Mobile Vertical */}
          <div className="flex flex-col items-center text-center py-6 mb-4">
            {/* Avatar */}
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold">
                {user?.username?.[0]?.toUpperCase() || "U"}
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform border-2 border-background">
                <Edit className="w-3.5 h-3.5 text-black" />
              </button>
            </div>

            {/* Info */}
            <h1 className="text-xl font-bold text-white mb-1">
              {user?.username || "User"}
            </h1>
            <p className="text-sm text-white/60 mb-3">{user?.email}</p>
            <Badge
              variant={
                user?.role === "SUPER_ADMIN"
                  ? "default"
                  : user?.role === "ADMIN"
                    ? "secondary"
                    : "outline"
              }
              className={`inline-flex items-center gap-1 ${
                user?.role === "SUPER_ADMIN"
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  : user?.role === "ADMIN"
                    ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                    : "bg-blue-500/20 text-blue-300 border-blue-500/30"
              }`}
            >
              {user?.role === "SUPER_ADMIN" && (
                <Star className="w-3 h-3 fill-amber-300" />
              )}
              {user?.role === "ADMIN" && <Shield className="w-3 h-3" />}
              {user?.role === "SUPER_ADMIN"
                ? "Super Admin"
                : user?.role === "ADMIN"
                  ? "Admin"
                  : user?.role === "GUEST"
                    ? "Guest"
                    : "User"}
            </Badge>
          </div>

          {/* Horizontal Scrollable Navigation */}
          <div className="relative -mx-4 bg-white/10">
            <div className="overflow-x-auto scrollbar-hidden">
              <div className="flex gap-2 p-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <Link
                      key={item.id}
                      to={item.href}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all flex-shrink-0",
                        "border backdrop-blur-sm",
                        isActive
                          ? "bg-white text-black border-white"
                          : "bg-neutral-900/60 text-white border-white/10 hover:bg-white/10"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 w-full px-0 md:px-16 2xl:p-16 md:overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
