"use client";

import { MonitorSmartphoneIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useMemo } from "react";

import { Button } from "@/components/ui/button";

interface ThemeToggleProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function ThemeToggle({ variant = "outline", size = "default", className }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = useCallback(() => {
    // Ciclo de 3 estados: light → dark → system → light...
    switch (theme) {
      case "light":
        setTheme("dark");
        break;
      case "dark":
        setTheme("system");
        break;
      case "system":
      default:
        setTheme("light");
        break;
    }
  }, [theme, setTheme]);

  const themeIcon = useMemo(() => {
    // Mostrar icono específico para cada estado
    switch (theme) {
      case "light":
        return <SunIcon className="size-4" />;
      case "dark":
        return <MoonIcon className="size-4" />;
      case "system":
      default:
        return <MonitorSmartphoneIcon className="size-4" />;
    }
  }, [theme]);

  const themeText = useMemo(() => {
    // Mostrar texto específico para cada estado
    switch (theme) {
      case "light":
        return "Modo claro";
      case "dark":
        return "Modo oscuro";
      case "system":
      default: {
        const isDarkResolved = resolvedTheme === "dark";
        return `Sistema (${isDarkResolved ? "Oscuro" : "Claro"})`;
      }
    }
  }, [theme, resolvedTheme]);

  return (
    <Button
      aria-label="Cambiar tema"
      onClick={toggleTheme}
      variant={variant}
      size={size}
      className={className}
    >
      {themeIcon}
      <span>{themeText}</span>
    </Button>
  );
}