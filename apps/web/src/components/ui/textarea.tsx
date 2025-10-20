import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Base styles matching Input component with neutral colors
        "flex min-h-[120px] w-full rounded-xl border-2 border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground",
        "transition-all duration-200 ease-in-out resize-none",
        "focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
        // Selection styles
        "selection:bg-primary/20",
        // Error state
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
