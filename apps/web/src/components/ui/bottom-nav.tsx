import { Link, useLocation } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Home, LibraryIcon, Settings } from "lucide-react";
import { useMemo } from "react";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    id: "home",
    label: "Home",
    href: "/",
    icon: <Home className="w-5 h-5" />,
  },
  {
    id: "library",
    label: "Library",
    href: "/library",
    icon: <LibraryIcon className="w-5 h-5" />,
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    icon: <Settings className="w-5 h-5" />,
  },
];

const BottomNav = () => {
  const location = useLocation();

  const activeTab = useMemo(() => {
    const path = location.pathname;
    if (path === "/") return "home";
    if (path.startsWith("/library")) return "library";
    if (path.startsWith("/settings")) return "settings";
    return "home";
  }, [location.pathname]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="p-4">
        <div className="bg-neutral-900/60 backdrop-blur-lg border border-white/10 rounded-[50px] p-1">
          <div className="grid grid-cols-3">
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={item.href}
                className={`${
                  activeTab === item.id ? "" : "hover:text-white/60"
                } relative flex flex-col items-center justify-center gap-1 text-white transition-colors h-14 rounded-[20px]`}
                style={{
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {activeTab === item.id && (
                  <motion.span
                    layoutId="bottom-nav-bubble"
                    className="absolute inset-0 z-10 bg-white mix-blend-difference rounded-[50px]"
                    transition={{
                      type: "spring",
                      bounce: 0.2,
                      duration: 0.6,
                    }}
                  />
                )}
                <span className="relative">{item.icon}</span>
                <span className="relative text-xs font-medium">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
