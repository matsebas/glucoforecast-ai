"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import { Separator } from "@/components/ui/separator";
import { patientSettingsSchema } from "@/lib/validations/patient-settings";

// Tipo derivado del esquema Zod
type PatientSettingsFormValues = z.infer<typeof patientSettingsSchema>;

export function PatientSettings() {
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PatientSettingsFormValues>({
    resolver: zodResolver(patientSettingsSchema),
    defaultValues: {
      isf: 100,
      icr: 10,
      targetLow: 70,
      targetHigh: 180,
    },
  });

  // Cargar configuración existente al montar el componente
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/patient-settings");

        if (!response.ok) {
          throw new Error("Error al cargar la configuración");
        }

        const data = await response.json();
        reset(data); // Actualizar el formulario con los datos obtenidos
      } catch (error) {
        console.error("Error al cargar la configuración:", error);
        toast.error("Preferencias personales", {
          description: "Error al intentar cargar la configuración",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [reset]);

  const onSubmit = async (data: PatientSettingsFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/patient-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // Manejar errores de validación
        if (result.validationErrors) {
          const errorMessage = result.validationErrors
            .map((err: { path: string; message: string }) => `${err.message}`)
            .join(", ");
          throw new Error(errorMessage);
        }
        throw new Error(result.message || result.error || "Error al guardar la configuración");
      }

      toast.success("Preferencias personales", {
        description: "La configuración se ha guardado correctamente.",
      });
    } catch (error) {
      console.error("Error al guardar la configuración:", error);
      toast.error("Preferencias personales", {
        description: "Error al guardar la configuración",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parámetros personales</CardTitle>
        <CardDescription>
          Configure sus parámetros personales para cálculos de insulina y rangos objetivo
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="isf">Factor de Sensibilidad a la Insulina (ISF)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="isf"
                  type="number"
                  placeholder="100"
                  {...register("isf", { valueAsNumber: true })}
                  className="w-24"
                  disabled={isLoading}
                />
                <span className="text-sm text-muted-foreground">mg/dL por unidad</span>
              </div>
              {errors.isf && <p className="text-sm text-destructive">{errors.isf.message}</p>}
              <p className="text-xs text-muted-foreground">
                Cuánto bajará su nivel de glucosa en sangre por cada unidad de insulina
              </p>
            </div>

            <Separator />

            <div className="grid gap-2">
              <Label htmlFor="icr">Relación Insulina-Carbohidratos (ICR)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="icr"
                  type="number"
                  placeholder="10"
                  {...register("icr", { valueAsNumber: true })}
                  className="w-24"
                  disabled={isLoading}
                />
                <span className="text-sm text-muted-foreground">g/unidad</span>
              </div>
              {errors.icr && <p className="text-sm text-destructive">{errors.icr.message}</p>}
              <p className="text-xs text-muted-foreground">
                Cuántos gramos de carbohidratos cubre 1 unidad de insulina
              </p>
            </div>

            <Separator />

            <div className="grid gap-2">
              <Label htmlFor="target-range">Rango Objetivo de Glucosa</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="target-low"
                  type="number"
                  placeholder="70"
                  {...register("targetLow", { valueAsNumber: true })}
                  className="w-24"
                  disabled={isLoading}
                />
                <span className="text-sm text-muted-foreground">-</span>
                <Input
                  id="target-high"
                  type="number"
                  placeholder="180"
                  {...register("targetHigh", { valueAsNumber: true })}
                  className="w-24"
                  disabled={isLoading}
                />
                <span className="text-sm text-muted-foreground">mg/dL</span>
              </div>
              {(errors.targetLow || errors.targetHigh) && (
                <p className="text-sm text-destructive">
                  {errors.targetLow?.message || errors.targetHigh?.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                El intervalo deseado para sus niveles de glucosa en sangre
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Cargando..." : "Guardar parámetros"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
