"use client";

import { Eye, EyeOff } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface PasswordInputProps extends Omit<React.ComponentProps<"input">, "type"> {
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
}

const PasswordInput = ({
  className,
  showPasswordLabel = "Mostrar contraseña",
  hidePasswordLabel = "Ocultar contraseña",
  ...props
}: PasswordInputProps) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        className={cn("pr-10", className)}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
        onClick={() => setShowPassword(!showPassword)}
        aria-label={showPassword ? hidePasswordLabel : showPasswordLabel}
      >
        {showPassword ? (
          <Eye className="size-4 text-muted-foreground" aria-hidden="true" />
        ) : (
          <EyeOff className="size-4 text-muted-foreground" aria-hidden="true" />
        )}
      </Button>
    </div>
  );
};
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
