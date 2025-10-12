import { cva, type VariantProps } from "class-variance-authority";
import type { JSX } from "preact/jsx-runtime";

// Utility to concatenate class names safely
function cn(...classes: Array<string | undefined | false | null>): string {
  return classes.filter(Boolean).join(" ");
}

const buttonStyles = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none disabled:opacity-60 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary:
          "bg-[#0071e3] text-white hover:bg-[#0077ed] hover:scale-[1.02] border-none",
        outline:
          "bg-transparent text-white border border-[#424245] hover:bg-[#2d2d2f] hover:scale-[1.02]",
        ghost: "bg-transparent text-[#86868b] hover:text-[#f5f5f7] border-none",
        subtle:
          "bg-black/60 text-white backdrop-blur-sm hover:bg-black/80 border-none",
      },
      size: {
        sm: "px-3 py-2",
        md: "px-6 py-3",
        icon: "w-10 h-10 p-0",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      block: false,
    },
  }
);

type ButtonVariants = VariantProps<typeof buttonStyles>;

export type ButtonProps = Omit<
  JSX.IntrinsicElements["button"],
  "size" | "className" | "type"
> &
  ButtonVariants & {
    className?: string;
    type?: "button" | "submit" | "reset";
  };

export function Button({
  variant,
  size,
  block,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  const classes = cn(buttonStyles({ variant, size, block }), className);
  return <button className={classes} type={type} {...props} />;
}

export default Button;
