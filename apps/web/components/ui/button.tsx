import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          // Variants
          variant === "default" &&
            "border-2 border-border bg-accent text-accent-foreground shadow-brutal hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-brutal-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
          variant === "destructive" &&
            "border-2 border-border bg-destructive text-destructive-foreground shadow-brutal hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-brutal-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
          variant === "outline" &&
            "border-2 border-border bg-transparent hover:bg-surface-raised",
          variant === "ghost" &&
            "hover:bg-surface-raised",
          // Sizes
          size === "default" && "h-10 px-5 py-2 text-sm",
          size === "sm" && "h-8 px-3 text-xs",
          size === "lg" && "h-12 px-8 text-base",
          size === "icon" && "h-10 w-10",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
