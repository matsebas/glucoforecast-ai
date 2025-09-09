"use client";

import { Loader2Icon } from "lucide-react";
import React, { SVGProps } from "react";

import { cn } from "@/lib/utils";

interface LoaderProps extends SVGProps<SVGSVGElement> {
  size?: "sm" | "md" | "lg";
}

const sizeValue = {
  sm: 8,
  md: 16,
  lg: 24,
};

export function Loader({ size = "md", className, ...props }: LoaderProps) {
  return (
    <Loader2Icon className={cn("animate-spin", className)} {...props} size={sizeValue[size]} />
  );
}
