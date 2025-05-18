"use client";

import { BarChart3, Bot, DropletIcon, FileUp, LogOut, Moon, Settings, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import React from "react";

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
import { Toggle } from "@/components/ui/toggle";

import { UserProfile } from "./user-profile";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const isActive = (path: string) => {
    return pathname === path;
  };

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
            <SidebarMenuButton asChild isActive={isActive("/dashboard/ai")}>
              <Link href="/dashboard/ai">
                <Bot className="size-5" />
                <span>Asistente IA</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/dashboard/upload")}>
              <Link href="/dashboard/upload">
                <FileUp className="size-5" />
                <span>Subir CSV</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/dashboard/settings")}>
              <Link href="/dashboard/settings">
                <Settings className="size-5" />
                <span>Configuración</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 flex-col gap-2">
        <Toggle
          aria-label="Toggle dark mode"
          pressed={theme === "dark"}
          onPressedChange={(pressed) => setTheme(pressed ? "dark" : "light")}
          variant="outline"
        >
          {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
          <span>{theme === "dark" ? "Modo oscuro" : "Modo claro"}</span>
        </Toggle>
        <Button variant="outline" onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogOut className="mr-2 size-4" />
          Cerrar sesión
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
