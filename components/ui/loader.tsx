"use client";

import { cn } from "@/lib/utils";

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-3",
  lg: "h-12 w-12 border-4",
};

export function Loader({ size = "md", className, ...props }: LoaderProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-solid border-t-transparent dark:border-slate-300 border-slate-700",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}
