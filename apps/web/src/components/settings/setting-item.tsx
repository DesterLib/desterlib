import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import type { SettingItem } from "@/config/settings-config";
import { Badge } from "../ui/badge";

interface SettingItemProps {
  item: SettingItem;
}

export function SettingItem({ item }: SettingItemProps) {
  const hasIcon = !!item.icon;
  const hasActions = item.actions && item.actions.length > 0;

  // Determine the type based on what's provided
  const itemType = item.type || (hasActions ? "actions" : "display");

  return (
    <li className="min-h-14 px-4 md:px-6 py-4 md:py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-0 md:gap-0 transition-colors">
      <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0 pb-3 md:pb-0">
        {hasIcon && (
          <div
            className={`w-8 h-8 flex-shrink-0 rounded flex items-center justify-center ${
              item.iconBgColor || "bg-white/10"
            }`}
          >
            <span className="text-xs font-bold">{item.icon}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm block">{item.label}</span>
          {item.description && (
            <p className="text-xs text-white/50 mt-0.5">{item.description}</p>
          )}
        </div>
        {/* Status badge - positioned right on mobile, stays in flow on desktop */}
        {item.status && (
          <Badge className={`${item.statusColor || "text-black"} md:hidden`}>
            {item.status}
          </Badge>
        )}
      </div>

      {/* Divider on mobile */}
      <div className="border-t border-white/10 md:hidden mb-3"></div>

      <div className="flex items-center gap-3 md:flex-shrink-0 justify-end md:justify-start">
        {/* Status badge - desktop only, moved to actions area */}
        {item.status && (
          <Badge
            className={`hidden md:inline-flex ${item.statusColor || "text-black"}`}
          >
            {item.status}
          </Badge>
        )}

        {/* Display value */}
        {item.value !== undefined &&
          typeof item.value === "string" &&
          itemType === "display" && (
            <span className="text-xs font-mono text-white/40">
              {item.value}
            </span>
          )}

        {/* Toggle Switch */}
        {itemType === "toggle" && item.toggle && (
          <Switch
            checked={item.toggle.checked}
            onCheckedChange={item.toggle.onChange}
          />
        )}

        {/* Slider */}
        {itemType === "slider" && item.slider && (
          <div className="flex items-center gap-3 w-full md:min-w-[200px] md:w-auto justify-end md:justify-start">
            <Slider
              min={item.slider.min}
              max={item.slider.max}
              step={item.slider.step || 1}
              value={[item.slider.value]}
              onValueChange={(values: number[]) =>
                item.slider!.onChange(values[0])
              }
              className="flex-1 max-w-[200px] md:max-w-none"
            />
            <span className="text-xs font-mono text-white/60 min-w-[3rem] text-right">
              {item.slider.value}
              {item.slider.unit}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        {itemType === "actions" &&
          hasActions &&
          item.actions!.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || "ghost"}
              size="icon"
              className="h-9 w-9 md:h-8 md:w-8 rounded-full flex-shrink-0"
              onClick={action.onClick}
              title={action.label}
              disabled={action.disabled}
            >
              {action.icon && <action.icon className="w-4 h-4" />}
            </Button>
          ))}
      </div>
    </li>
  );
}
