import { object, string, z } from "zod";

export const signInSchema = object({
  email: string({ required_error: "El email es requerido" })
    .min(1, "El email es requerido")
    .email("El email inválido"),
  password: string({ required_error: "La contraseña es requerida" })
    .min(1, "La contraseña es requerida")
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(32, "La contraseña debe tener hasta 32 caracteres"),
});

export const signUpSchema = object({
  name: string({ required_error: "El nombre es requerido" })
    .min(1, "El nombre es requerido")
    .max(100, "El nombre debe tener menos de 100 caracteres"),
  email: string({ required_error: "El email es requerido" })
    .min(1, "El email es requerido")
    .email("El email inválido"),
  password: string({ required_error: "La contraseña es requerida" })
    .min(1, "La contraseña es requerida")
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(32, "La contraseña debe tener hasta 32 caracteres"),
  confirmPassword: string({ required_error: "La confirmación de contraseña es requerida" }).min(
    1,
    "La confirmación de contraseña es requerida"
  ),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: string()
    .min(1, "El email es requerido")
    .email("Email inválido")
    .max(255, "El email es demasiado largo"),
});

export const resetPasswordSchema = object({
  token: string().min(1, "Token requerido"),
  password: string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(32, "La contraseña debe tener hasta 32 caracteres"),
  confirmPassword: z.string().min(1, "Confirme la contraseña"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});
