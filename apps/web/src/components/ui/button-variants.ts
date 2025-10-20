import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 active:scale-[0.98] overflow-hidden relative",
  {
    variants: {
      variant: {
        // Flat primary button with subtle border
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 border border-primary/20",
        // Flat destructive button with subtle border
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/20 active:bg-destructive/80 border border-destructive/20",
        // Flat outlined button
        outline:
          "border-2 border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring active:bg-accent/80",
        // Flat secondary button with subtle border
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-ring/20 active:bg-secondary/60 border border-border/20",
        // Material Design ghost button with neutral colors
        ghost:
          "hover:bg-accent hover:text-accent-foreground active:bg-accent/80 rounded-full",
        // iOS link button
        link: "text-primary underline-offset-4 hover:underline active:text-primary/80",
      },
      size: {
        // iOS height standards
        default: "h-10 px-6 py-2 has-[>svg]:px-4 text-[16px]",
        sm: "h-8 rounded-lg gap-1.5 px-4 has-[>svg]:px-3 text-[14px]",
        lg: "h-12 rounded-xl px-8 has-[>svg]:px-6 text-[18px]",
        icon: "size-10 rounded-xl",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
