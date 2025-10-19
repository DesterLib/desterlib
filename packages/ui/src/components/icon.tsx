import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils";

const iconVariants = cva("material-symbols-rounded", {
  variants: {
    weight: {
      100: "font-thin",
      200: "font-extralight",
      300: "font-light",
      400: "font-normal",
      500: "font-medium",
      600: "font-semibold",
      700: "font-bold",
    },
  },
  defaultVariants: {
    weight: 400,
  },
});

export interface IconProps {
  /** The Material Symbol icon name (e.g., 'home', 'settings', 'favorite') */
  name: string;
  /** Icon size in pixels */
  size?: number;
  /** Whether the icon is filled */
  filled?: boolean;
  /** Font weight */
  weight?: VariantProps<typeof iconVariants>["weight"];
  /** Additional CSS classes */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Click handler */
  onClick?: () => void;
  /** Custom font variation settings */
  variationSettings?: {
    fill?: number; // 0-1
    weight?: number; // 100-700
    grade?: number; // -25 to 200
    opticalSize?: number; // 20-48
  };
}

export function Icon({
  name,
  size = 24,
  filled,
  weight,
  className,
  style,
  onClick,
  variationSettings,
}: IconProps) {
  const baseClass = filled
    ? "material-symbols-rounded-filled"
    : "material-symbols-rounded";

  const customStyle: React.CSSProperties = {
    fontSize: `${size}px`,
    ...style,
    ...(variationSettings && {
      fontVariationSettings: `'FILL' ${variationSettings.fill ?? (filled ? 1 : 0)}, 'wght' ${variationSettings.weight ?? 400}, 'GRAD' ${variationSettings.grade ?? 0}, 'opsz' ${variationSettings.opticalSize ?? size}`,
    }),
  };

  return (
    <span
      className={cn(
        baseClass,
        iconVariants({ weight }),
        "!leading-none",
        className
      )}
      style={customStyle}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {name}
    </span>
  );
}

Icon.displayName = "Icon";
