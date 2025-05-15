"use client";

import { AlertCircle, CheckCircle2, Key } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type React from "react";

export default function SettingsPage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    success?: boolean;
    message?: string;
  }>({});
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [autoSync, setAutoSync] = useState(true);

  const { theme, setTheme } = useTheme();

  const handleCredentialsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!credentials.username || !credentials.password) {
      setConnectionStatus({
        success: false,
        message: "Por favor, complete todos los campos.",
      });
      return;
    }

    setIsConnecting(true);
    setConnectionStatus({});

    try {
      // In a real application, this would connect to the FreeStyle Libre API
      // const response = await fetch("/api/connect-freestyle", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json"
      //   },
      //   body: JSON.stringify(credentials)
      // })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setConnectionStatus({
        success: true,
        message: "Conexión exitosa con la API de FreeStyle Libre.",
      });
    } catch (error) {
      console.error("Error al conectar con la API:", error);
      setConnectionStatus({
        success: false,
        message: "Error al conectar con la API. Verifique sus credenciales e intente nuevamente.",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Configuración</h1>

      <Tabs defaultValue="api" className="space-y-4">
        <TabsList>
          <TabsTrigger value="api">API de FreeStyle Libre</TabsTrigger>
          <TabsTrigger value="preferences">Preferencias</TabsTrigger>
        </TabsList>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de API de FreeStyle Libre</CardTitle>
              <CardDescription>
                Conecte su cuenta de FreeStyle Libre para sincronizar automáticamente sus datos de
                glucosa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleConnect} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Nombre de usuario</Label>
                  <Input
                    id="username"
                    name="username"
                    placeholder="Ingrese su nombre de usuario de FreeStyle Libre"
                    value={credentials.username}
                    onChange={handleCredentialsChange}
                    disabled={isConnecting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <PasswordInput
                    id="password"
                    name="password"
                    placeholder="Ingrese su contraseña de FreeStyle Libre"
                    value={credentials.password}
                    onChange={handleCredentialsChange}
                    disabled={isConnecting}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-sync"
                    checked={autoSync}
                    onCheckedChange={setAutoSync}
                    disabled={isConnecting}
                  />
                  <Label htmlFor="auto-sync">Sincronización automática</Label>
                </div>

                {connectionStatus.message && (
                  <Alert variant={connectionStatus.success ? "default" : "destructive"}>
                    {connectionStatus.success ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertTitle>{connectionStatus.success ? "Éxito" : "Error"}</AlertTitle>
                    <AlertDescription>{connectionStatus.message}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" disabled={isConnecting}>
                  {isConnecting ? (
                    <>Conectando...</>
                  ) : (
                    <>
                      <Key className="mr-2 h-4 w-4" />
                      Conectar
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Sus credenciales se almacenan de forma segura y solo se utilizan para acceder a sus
                datos de glucosa.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de Usuario</CardTitle>
              <CardDescription>Personalice su experiencia en GlucoForecast AI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Notificaciones</Label>
                  <p className="text-sm text-muted-foreground">
                    Reciba alertas sobre patrones importantes
                  </p>
                </div>
                <Switch id="notifications" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Modo oscuro</Label>
                  <p className="text-sm text-muted-foreground">Cambie entre modo claro y oscuro</p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={theme === "dark"}
                  onCheckedChange={(value) => setTheme(value ? "dark" : "light")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="units">Unidades de medida</Label>
                  <p className="text-sm text-muted-foreground">mg/dL o mmol/L</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="units-mgdl" className="text-sm">
                    mg/dL
                  </Label>
                  <Switch id="units" />
                  <Label htmlFor="units-mmol" className="text-sm">
                    mmol/L
                  </Label>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Guardar preferencias</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
