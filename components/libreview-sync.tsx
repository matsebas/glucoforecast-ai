"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LibreViewSyncFormValues {
  email: string;
  password: string;
  days: string;
}

export function LibreViewSync() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LibreViewSyncFormValues>({
    defaultValues: {
      email: "",
      password: "",
      days: "90",
    },
  });

  const onSubmit = async (data: LibreViewSyncFormValues) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/libreview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          days: parseInt(data.days),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || "Error al sincronizar con LibreView");
      }

      if (result.success) {
        toast.success("Sincronización exitosa", {
          description: result.message,
        });
      } else {
        toast.error("Error al sincronizar con LibreView", {
          description: result.message,
        });
      }
    } catch (error) {
      console.error("Error al sincronizar con LibreView:", error);
      toast.error("Error al sincronizar con LibreView", {
        description: error instanceof Error ? error.message : "Error al sincronizar con LibreView",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sincronizar con LibreView</CardTitle>
        <CardDescription>
          Conecta tu cuenta de LibreView para importar automáticamente tus lecturas de glucosa.
        </CardDescription>
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
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña de LibreView</Label>
            <PasswordInput
              id="password"
              {...register("password", { required: "La contraseña es obligatoria" })}
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="days">Período de datos a importar</Label>
            <Select defaultValue="90" {...register("days")}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 días</SelectItem>
                <SelectItem value="14">Últimos 14 días</SelectItem>
                <SelectItem value="30">Últimos 30 días</SelectItem>
                <SelectItem value="90">Últimos 90 días</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              Tus credenciales se utilizan únicamente para conectar con LibreView y no se almacenan
              en nuestros servidores.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Sincronizando..." : "Sincronizar datos"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
