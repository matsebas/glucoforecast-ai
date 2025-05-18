"use client";

import { useTheme } from "next-themes";

import { LibreViewSync } from "@/components/libreview-sync";
import { PatientSettings } from "@/components/patient-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type React from "react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Configuración</h1>

      <Tabs defaultValue="preferences" className="space-y-4">
        <TabsList>
          <TabsTrigger value="preferences">Preferencias</TabsTrigger>
          <TabsTrigger value="api">LibreLink API</TabsTrigger>
        </TabsList>

        <TabsContent value="preferences">
          <PatientSettings />
        </TabsContent>

        <TabsContent value="api">
          <LibreViewSync />
        </TabsContent>
      </Tabs>
    </div>
  );
}
