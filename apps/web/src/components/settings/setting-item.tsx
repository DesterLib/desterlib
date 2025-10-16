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
    <li className="min-h-14 px-6 py-3 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-4 flex-1">
        {hasIcon && (
          <div
            className={`w-8 h-8 rounded flex items-center justify-center ${
              item.iconBgColor || "bg-white/10"
            }`}
          >
            <span className="text-xs font-bold">{item.icon}</span>
          </div>
        )}
        <div className="flex-1">
          <span className="font-medium text-sm">{item.label}</span>
          {item.description && (
            <p className="text-xs text-white/50">{item.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Status badge */}
        {item.status && (
          <Badge className={item.statusColor || "text-black"}>
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
          <div className="flex items-center gap-3 min-w-[200px]">
            <Slider
              min={item.slider.min}
              max={item.slider.max}
              step={item.slider.step || 1}
              value={[item.slider.value]}
              onValueChange={(values: number[]) =>
                item.slider!.onChange(values[0])
              }
              className="flex-1"
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
              className="h-8 w-8 rounded-full"
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
