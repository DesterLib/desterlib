import { useState, memo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  Shield,
  LogIn,
  Star,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Badge } from "@/components/ui/badge";

function UserMenu() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  if (!isAuthenticated) {
    return (
      <div className="border bg-neutral-900/60 rounded-[50px] p-1 ml-2">
        <button
          onClick={() => navigate({ to: "/login" })}
          className="h-10 px-4 backdrop-blur-lg rounded-[50px] flex items-center gap-2 hover:bg-white/10 transition-colors"
        >
          <LogIn className="w-4 h-4" />
          <span className="text-sm font-medium text-white">Sign In</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative ml-2">
      <div className="border bg-neutral-900/60 backdrop-blur-lg rounded-[50px] p-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="h-10 px-1  rounded-[50px] flex items-center gap-2 justify-between hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                user?.role === "SUPER_ADMIN"
                  ? "bg-gradient-to-br from-amber-500 to-yellow-500"
                  : user?.role === "ADMIN"
                    ? "bg-gradient-to-br from-purple-500 to-blue-500"
                    : "bg-gradient-to-br from-blue-500 to-cyan-500"
              }`}
            >
              {user?.role === "SUPER_ADMIN" ? (
                <Star className="w-4 h-4 text-white fill-white" />
              ) : user?.role === "ADMIN" ? (
                <Shield className="w-4 h-4 text-white" />
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
            </div>
            <span className="text-sm font-medium text-white">
              {user?.username}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isOpen && (
          <>
            {/* Backdrop to close menu */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="absolute right-0 mt-2 w-56 bg-neutral-900/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              {/* User Info */}
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-sm font-medium text-white">
                  {user?.username}
                </p>
                {user?.email && (
                  <p className="text-xs text-white/60 mt-0.5">{user.email}</p>
                )}
                <div className="mt-2">
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

              {/* Menu Items */}
              <div className="py-1">
                {/* Only show settings for non-guest users */}
                {user?.role !== "GUEST" && (
                  <button
                    onClick={() => {
                      navigate({ to: "/settings" });
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                )}

                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default memo(UserMenu);
