import type { LucideIcon } from "lucide-react";

export interface SettingAction {
  label: string;
  icon?: LucideIcon;
  variant?: "default" | "ghost" | "menuItem" | "modification" | "danger";
  onClick?: () => void;
  disabled?: boolean;
}

export interface SliderConfig {
  min: number;
  max: number;
  step?: number;
  value: number;
  unit?: string;
  onChange: (value: number) => void;
}

export interface ToggleConfig {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export type SettingType = "actions" | "toggle" | "slider" | "display";

export interface SettingItem {
  id: string;
  label: string;
  description?: string;
  type?: SettingType; // defaults to "actions" if actions provided, "display" otherwise

  // Display options
  value?: string | number | boolean;
  status?: string;
  statusColor?: string;
  icon?: string;
  iconBgColor?: string;

  // Actions (for type="actions")
  actions?: SettingAction[];

  // Toggle (for type="toggle")
  toggle?: ToggleConfig;

  // Slider (for type="slider")
  slider?: SliderConfig;
}

export interface SettingGroup {
  id: string;
  title: string;
  description?: string;
  headerAction?: SettingAction;
  items: SettingItem[];
}

export interface SettingsPageConfig {
  title: string;
  description: string;
  groups: SettingGroup[];
}
