import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "border hover:scale-105 active:scale-95 bg-neutral-900/60 backdrop-blur-lg border-white/10 rounded-[50px] flex items-center justify-center active:bg-white active:text-black active:border-white [will-change:backdrop-filter]",
        ghost:
          "border hover:scale-105 active:scale-95 border-transparent rounded-[50px] flex items-center justify-center hover:bg-neutral-800/60 hover:border-white/10 active:bg-white active:text-black active:border-white",
        menuItem:
          "rounded-lg flex items-center justify-start hover:bg-neutral-700/60 active:bg-white active:text-black data-[active=true]:bg-white data-[active=true]:text-black",
        modification:
          "border hover:scale-105 active:scale-95 border-transparent rounded-lg flex items-center justify-center hover:bg-white/10 active:border-white active:bg-white text-blue-400 hover:text-blue-300 active:text-blue-500",
        danger:
          "border hover:scale-105 active:scale-95 border-transparent rounded-lg flex items-center justify-center hover:bg-white/10 active:border-white active:bg-white text-red-400 hover:text-red-300 active:text-red-500",
      },
      size: {
        default: "px-4 h-10 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
