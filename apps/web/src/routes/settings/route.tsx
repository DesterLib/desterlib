import { Icon } from "@/components/custom/icon";
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
} from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
  beforeLoad: () => {
    throw redirect({
      to: "/settings/libraries",
    });
  },
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
  return (
    <div className="max-w-[1440px] mx-auto px-6 flex gap-6 flex-col pt-[120px]">
      <div className="flex flex-col gap-4">
        <h1 className="text-xl">Settings</h1>
      </div>
      <section className="flex gap-6">
        <nav className="flex flex-col gap-4 max-w-[200px] w-full">
          <SettingsLink
            to="/settings/libraries"
            label="Libraries"
            icon="folder_managed"
          />
          <SettingsLink
            to="/settings/library"
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
