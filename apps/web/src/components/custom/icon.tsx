import React from "react";
import { cn } from "@/lib/utils";

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The Material Symbol name (e.g., 'home', 'settings', 'search') */
  name: string;
  /** Size of the icon */
  size?: number | string;
  /** Whether the icon should be filled */
  filled?: boolean;
  /** Weight variant (100-700) */
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
  /** Grade variant (-25 to 200) */
  grade?: number;
  /** Optical size (20-48) */
  opticalSize?: number;
}

export const Icon = React.forwardRef<HTMLSpanElement, IconProps>(
  (
    {
      name,
      size = 24,
      filled = false,
      weight = 400,
      grade = 0,
      opticalSize = 24,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const iconStyle: React.CSSProperties = {
      fontSize: typeof size === "number" ? `${size}px` : size,
      fontVariationSettings: `"FILL" ${filled ? 1 : 0}, "wght" ${weight}, "GRAD" ${grade}, "opsz" ${opticalSize}`,
      ...style,
    };

    return (
      <span
        ref={ref}
        className={cn(
          filled
            ? "material-symbols-rounded-filled"
            : "material-symbols-rounded",
          className
        )}
        style={iconStyle}
        {...props}
      >
        {name}
      </span>
    );
  }
);

Icon.displayName = "Icon";
