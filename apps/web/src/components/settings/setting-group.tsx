import { Button } from "@/components/ui/button";
import type { SettingGroup as SettingGroupType } from "@/config/settings-config.ts";
import { SettingItem } from "./setting-item.tsx";

interface SettingGroupProps {
  group: SettingGroupType;
}

export function SettingGroup({ group }: SettingGroupProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{group.title}</h2>
          {group.description && (
            <p className="text-xs text-white/50 mt-0.5">{group.description}</p>
          )}
        </div>
        {group.headerAction && (
          <Button
            variant={group.headerAction.variant || "default"}
            size="sm"
            onClick={group.headerAction.onClick}
          >
            {group.headerAction.icon && (
              <group.headerAction.icon className="w-4 h-4 mr-2" />
            )}
            {group.headerAction.label}
          </Button>
        )}
      </div>
      <ul className="bg-neutral-900/60 backdrop-blur-sm border border-white/10 rounded-2xl divide-y divide-white/10 overflow-hidden">
        {group.items.map((item) => (
          <SettingItem key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}
