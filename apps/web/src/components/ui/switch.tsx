import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer group data-[state=checked]:bg-[#7c7eff] data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80 inline-flex h-5 w-10 shrink-0 items-center rounded-full border border-transparent shadow-xs outline-none disabled:cursor-not-allowed disabled:opacity-50",
        "transition-colors duration-200 ease-in-out",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-white/90 backdrop-blur-sm pointer-events-none block h-4 w-6 rounded-full shadow-sm ring-0",
          "transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          "data-[state=checked]:translate-x-[calc(100%-12px)]",
          "data-[state=unchecked]:translate-x-[2px]",
          "group-hover:scale-125"
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
