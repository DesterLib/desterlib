"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ReactNode } from "react";
import { cn } from "../utils";
import { Icon, type IconProps } from "./icon";

const buttonVariants = cva(
  "flex items-center rounded-full transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "bg-white text-black hover:bg-gray-100 hover:scale-105",
        secondary:
          "bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20",
        ghost: "text-white hover:bg-white/10",
      },
      size: {
        sm: "h-10 px-4 text-sm gap-2",
        md: "h-12 px-6 text-base gap-2",
        lg: "h-14 px-8 text-lg gap-2",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "popover">,
    VariantProps<typeof buttonVariants> {
  /** Optional icon name for Material Symbol */
  icon?: IconProps["name"];
  /** Icon size */
  iconSize?: IconProps["size"];
  /** Whether icon is filled */
  iconFilled?: IconProps["filled"];
  /** Custom icon className */
  iconClassName?: string;
  /** Button content */
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      icon,
      iconSize,
      iconFilled,
      iconClassName,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(
          buttonVariants({ variant, size, fullWidth, className }),
          "justify-center leading-none"
        )}
        ref={ref}
        {...props}
      >
        {icon && (
          <Icon
            name={icon}
            size={iconSize}
            filled={iconFilled}
            className={cn("flex-shrink-0", iconClassName)}
          />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
