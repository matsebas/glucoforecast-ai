"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { LibreUserData } from "@/lib/types";

interface LibreViewSyncFormValues {
  email: string;
  password: string;
}

export default function LibreViewApiPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userData, setUserData] = useState<LibreUserData | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LibreViewSyncFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LibreViewSyncFormValues) => {
    setIsLoading(true);
    setUserData(null);
    setSelectedPatientId("");

    try {
      const response = await fetch("/api/libreview/authentication", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || "Error al acceder a LibreView");
      }

      if (result.success && result.data) {
        setUserData(result.data);
        setCredentials({ email: data.email, password: data.password });
        toast.success("Acceso exitoso", {
          description: `Bienvenido ${result.data.firstName} ${result.data.lastName}`,
        });
        
        // Si solo hay una conexión, seleccionarla automáticamente
        if (result.data.connections.length === 1) {
          setSelectedPatientId(result.data.connections[0].patientId);
        }
      } else {
        toast.error("Error al acceder a LibreView", {
          description: result.message,
        });
      }
    } catch (error) {
      console.error("Error al acceder a LibreView:", error);
      toast.error("Error al acceder a LibreView", {
        description: error instanceof Error ? error.message : "Error al acceder a LibreView",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessPatient = async () => {
    if (!userData || !selectedPatientId || !credentials) return;

    setIsProcessing(true);

    try {
      const response = await fetch("/api/libreview/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          patientId: selectedPatientId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || "Error al procesar datos");
      }

      if (result.success) {
        toast.success("Procesamiento exitoso", {
          description: result.message,
        });
      } else {
        toast.error("Error al procesar datos", {
          description: result.message,
        });
      }
    } catch (error) {
      console.error("Error al procesar datos:", error);
      toast.error("Error al procesar datos", {
        description: error instanceof Error ? error.message : "Error al procesar datos",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">LibreView API</h1>
        <p className="text-muted-foreground">Permite sincronizar tus datos con LibreView</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Conectar con LibreView</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label htmlFor="email">Email de LibreView</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu.email@ejemplo.com"
                {...register("email", { required: "El email es obligatorio" })}
                disabled={!!userData}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña de LibreView</Label>
              <PasswordInput
                id="password"
                {...register("password", { required: "La contraseña es obligatoria" })}
                disabled={!!userData}
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>

            <div className="text-sm text-muted-foreground">
              <p>
                Tus credenciales se utilizan únicamente para conectar con LibreView y no se
                almacenan en nuestros servidores.
              </p>
            </div>
            <Separator />
          </CardContent>
          <CardFooter className="pt-6">
            <Button type="submit" disabled={isLoading || !!userData}>
              {isLoading ? "Accediendo..." : "Acceder"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {userData && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Seleccionar Paciente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label htmlFor="patient">Paciente disponible</Label>
              {userData.connections.length > 1 ? (
                <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {userData.connections.map((connection) => (
                      <SelectItem key={connection.patientId} value={connection.patientId}>
                        {connection.firstName} {connection.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Paciente: {userData.connections[0].firstName} {userData.connections[0].lastName}
                </p>
              )}
            </div>
            <Separator />
          </CardContent>
          <CardFooter className="pt-6 space-x-2">
            <Button 
              onClick={handleProcessPatient}
              disabled={isProcessing || !selectedPatientId}
            >
              {isProcessing ? "Procesando..." : "Procesar"}
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setUserData(null);
                setSelectedPatientId("");
                setCredentials(null);
              }}
            >
              Cambiar cuenta
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
