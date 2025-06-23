"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Separator } from "@/components/ui/separator";

interface LibreViewSyncFormValues {
  email: string;
  password: string;
  days: string;
}

export default function LibreViewApiPage() {
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">LibreView API</h1>
        <p className="text-muted-foreground">Permite sincronizar tus datos con LibreView</p>
      </div>

      <Card className="max-w-2xl">
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

            <div className="text-sm text-muted-foreground">
              <p>
                Tus credenciales se utilizan únicamente para conectar con LibreView y no se
                almacenan en nuestros servidores.
              </p>
            </div>
            <Separator />
          </CardContent>
          <CardFooter className="pt-6">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Sincronizando..." : "Sincronizar datos"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
