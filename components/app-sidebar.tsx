"use client";

import {
  BarChart3,
  Bot,
  CloudCheckIcon,
  DropletIcon,
  FileUp,
  LogOut,
  Moon,
  Settings,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import React, { useCallback, useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

import { UserProfile } from "./user-profile";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const isActive = useCallback(
    (path: string) => {
      return pathname === path;
    },
    [pathname]
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const themeIcon = useMemo(() => {
    return theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />;
  }, [theme]);

  const themeText = useMemo(() => {
    return theme === "dark" ? "Modo oscuro" : "Modo claro";
  }, [theme]);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="flex items-center justify-center p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <DropletIcon className="size-6 text-primary" />
          <span className="text-xl font-bold">GlucoForecast AI</span>
        </Link>
        <UserProfile />
      </SidebarHeader>
      <SidebarContent>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/dashboard")}>
              <Link href="/dashboard">
                <BarChart3 className="size-5" />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/ai")}>
              <Link href="/ai">
                <Bot className="size-5" />
                <span>Asistente IA</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/csv-upload")}>
              <Link href="/csv-upload">
                <FileUp className="size-5" />
                <span>Subir CSV</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/libre-view-api")}>
              <Link href="/libre-view-api">
                <CloudCheckIcon className="size-5" />
                <span>LibreView API</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/settings")}>
              <Link href="/settings">
                <Settings className="size-5" />
                <span>Configuración</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 flex-col gap-2">
        <Button aria-label="Toggle dark mode" onClick={toggleTheme} variant="outline">
          {themeIcon}
          <span>{themeText}</span>
        </Button>
        <Button variant="outline" onClick={() => signOut({ redirect: true, redirectTo: "/" })}>
          <LogOut className="mr-2 size-4" />
          Cerrar sesión
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
