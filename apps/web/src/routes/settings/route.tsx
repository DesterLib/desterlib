import { Icon } from "@/components/custom/icon";
import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useLocation,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
});

const SettingsLink = ({
  to,
  label,
  icon,
}: {
  to: string;
  label: string;
  icon: string;
}) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      className={cn(
        "h-10 px-4 rounded-xl transition-all group flex items-center justify-start",
        isActive ? "bg-white text-black" : "hover:bg-white/10 hover:scale-105"
      )}
      to={to}
    >
      {icon && (
        <Icon
          name={icon}
          size={24}
          filled
          className={cn(
            "transition-colors duration-200 mr-2",
            isActive ? "text-black" : "group-hover:text-white"
          )}
        />
      )}
      <span
        className={cn(
          "text-base transition-colors duration-200",
          isActive ? "text-black" : "group-hover:text-white"
        )}
      >
        {label}
      </span>
    </Link>
  );
};

function RouteComponent() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect to libraries if we're on the base settings path
    if (
      location.pathname === "/settings" ||
      location.pathname === "/settings/"
    ) {
      navigate({ to: "/settings/libraries", replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <div className="max-w-[1440px] mx-auto px-6 flex gap-6 flex-col pt-[120px]">
      <section className="flex gap-6 bg-card rounded-2xl">
        <nav className="flex flex-col gap-4 max-w-[280px] w-full p-6 border-r border-border">
          <h1 className="text-xl">Settings</h1>
          <SettingsLink
            to="/settings/libraries"
            label="Libraries"
            icon="folder_managed"
          />
          <SettingsLink
            to="/settings/general"
            label="General"
            icon="settings"
          />
        </nav>
        <div className="w-full flex-1">
          <Outlet />
        </div>
      </section>
    </div>
  );
}
