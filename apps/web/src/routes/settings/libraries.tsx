import { createFileRoute } from "@tanstack/react-router";
import { SettingGroup } from "@/components/settings/setting-group";
import { librariesSettingsConfig } from "@/config/libraries-settings";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

export const Route = createFileRoute("/settings/libraries")({
  component: RouteComponent,
});

function RouteComponent() {
  const [checked, setChecked] = useState(false);
  return (
    <div className="h-full flex flex-col p-4 rounded-xl">
      {/* Fixed Header */}
      <Switch checked={checked} onCheckedChange={setChecked} />
      <header className="space-y-1 pb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold">{librariesSettingsConfig.title}</h1>
        <p className="text-sm text-white/60">
          {librariesSettingsConfig.description}
        </p>
      </header>

      {/* Scrollable Content with Gradient Masks */}
      <div className="relative flex-1 overflow-hidden">
        {/* Top Gradient Mask */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-background/80 via-background/40 to-transparent pointer-events-none z-10" />

        {/* Scrollable Content */}
        <div
          className="h-full overflow-y-auto space-y-6 px-1 py-8"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent 0px, black 32px, black calc(100% - 32px), transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0px, black 32px, black calc(100% - 32px), transparent 100%)",
          }}
        >
          {librariesSettingsConfig.groups.map((group) => (
            <SettingGroup key={group.id} group={group} />
          ))}
        </div>

        {/* Bottom Gradient Mask */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background/80 via-background/40 to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
}
