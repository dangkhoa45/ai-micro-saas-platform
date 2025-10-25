"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "outline";
  size?: "sm" | "md" | "lg";
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full font-medium transition-colors",
          // Size variants
          {
            "px-2 py-0.5 text-xs": size === "sm",
            "px-2.5 py-0.5 text-sm": size === "md",
            "px-3 py-1 text-base": size === "lg",
          },
          // Color variants
          {
            "bg-primary text-primary-foreground hover:bg-primary/90":
              variant === "default",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80":
              variant === "secondary",
            "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400":
              variant === "success",
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400":
              variant === "warning",
            "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400":
              variant === "error",
            "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400":
              variant === "info",
            "border border-input bg-background hover:bg-accent hover:text-accent-foreground":
              variant === "outline",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
