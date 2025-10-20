import { Icon } from "@/components/custom/icon";
import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useLocation,
} from "@tanstack/react-router";
import { useEffect } from "react";

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
  return (
    <Link
      className="hover:bg-gray-100 h-10 px-4 rounded-xl transition-all group hover:scale-105 flex items-center justify-start"
      to={to}
    >
      {icon && (
        <Icon
          name={icon}
          size={24}
          filled
          className="group-hover:text-black transition-colors duration-200 mr-2"
        />
      )}
      <span className="text-base group-hover:text-black transition-colors duration-200">
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
      <div className="flex flex-col gap-4">
        <h1 className="text-xl">Settings</h1>
      </div>
      <section className="flex gap-6">
        <nav className="flex flex-col gap-4 max-w-[280px] w-full">
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
