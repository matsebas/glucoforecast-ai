"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { ZodError } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { signInSchema } from "@/lib/validations/auth";

import type React from "react";

type FormErrors = {
  email?: string[];
  password?: string[];
  general?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const registered = searchParams.get("registered") === "true";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.push(callbackUrl);
    }

    if (registered) {
      setSuccess("Registro exitoso. Ahora puede iniciar sesión.");
    }
  }, [status, router, callbackUrl, registered]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    try {
      signInSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors: FormErrors = {};

        error.errors.forEach((err) => {
          const path = err.path[0] as keyof FormErrors;
          if (path === "general") {
            formattedErrors[path] = err.message;
          } else {
            if (!formattedErrors[path]) {
              formattedErrors[path] = [];
            }
            (formattedErrors[path] as string[]).push(err.message);
          }
        });

        setErrors(formattedErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar formulario con Zod
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    setSuccess("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
        redirectTo: callbackUrl,
      });

      if (result?.error) {
        console.error(">> LOGIN: Error de inicio de sesión:", result.error);
        setErrors({
          general: "Credenciales inválidas. Por favor, intente nuevamente.",
        });
      } else if (result?.url) {
        console.info(">> LOGIN: Redirigiendo a:", result.url);
        router.push(result.url);
      }
    } catch (error) {
      console.error("Error de inicio de sesión:", error);
      setErrors({
        general: "Ocurrió un error al iniciar sesión. Por favor, intente nuevamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">GlucoForecast AI</CardTitle>
          <CardDescription>Ingrese sus credenciales para acceder a su cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle2 className="size-4 text-green-600" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <PasswordInput
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password[0]}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            ¿No tiene una cuenta?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Registrarse
            </Link>
          </div>
          <p className="text-sm text-center text-gray-500">
            GlucoForecast AI: Gestión Inteligente de Diabetes Tipo 1
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
