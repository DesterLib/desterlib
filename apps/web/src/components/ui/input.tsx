import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles with neutral color variables
        "flex h-12 w-full min-w-0 rounded-xl border-2 border-input bg-background px-4 text-base text-foreground placeholder:text-muted-foreground",
        "transition-all duration-200 ease-in-out",
        "focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
        // File input styles
        "file:mr-4 file:border-0 file:bg-transparent file:py-2 file:px-4 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/10",
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

export { Input };
