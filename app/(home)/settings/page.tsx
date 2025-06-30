"use client";

import { PatientSettings } from "@/components/patient-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type React from "react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Configura tus preferencias</p>
      </div>
      <Tabs defaultValue="preferences" className="space-y-4 max-w-2xl">
        <TabsList>
          <TabsTrigger value="preferences">Preferencias</TabsTrigger>
        </TabsList>

        <TabsContent value="preferences">
          <PatientSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
