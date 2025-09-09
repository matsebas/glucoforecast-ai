"use client";

import {
  BarChart3Icon,
  BotIcon,
  CloudCheckIcon,
  DropletIcon,
  FileUpIcon,
  LogOutIcon,
  SettingsIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import React, { useCallback } from "react";

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

import { ThemeToggle } from "./theme-toggle";
import { UserProfile } from "./user-profile";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  const isActive = useCallback(
    (path: string) => {
      return pathname === path;
    },
    [pathname]
  );

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
                <BarChart3Icon className="size-5" />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/ai")}>
              <Link href="/ai">
                <BotIcon className="size-5" />
                <span>Asistente IA</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/csv-upload")}>
              <Link href="/csv-upload">
                <FileUpIcon className="size-5" />
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
          {/*<SidebarMenuItem>*/}
          {/*  <SidebarMenuButton asChild isActive={isActive("/libre-view-reports")}>*/}
          {/*    <Link href="/libre-view-reports">*/}
          {/*      <FileChartLineIcon className="size-5" />*/}
          {/*      <span>LibreView Reports</span>*/}
          {/*    </Link>*/}
          {/*  </SidebarMenuButton>*/}
          {/*</SidebarMenuItem>*/}
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/settings")}>
              <Link href="/settings">
                <SettingsIcon className="size-5" />
                <span>Configuración</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 flex-col gap-2">
        <ThemeToggle variant="outline" />
        <Button variant="outline" onClick={() => signOut({ redirect: true, redirectTo: "/" })}>
          <LogOutIcon className="mr-2 size-4" />
          Cerrar sesión
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
