import { object, number } from "zod";

export const patientSettingsSchema = object({
  isf: number({ required_error: "El Factor de Sensibilidad a la Insulina es requerido" })
    .int("El valor debe ser un número entero")
    .min(25, "El valor debe ser mayor o igual que 25")
    .max(200, "El valor debe ser menor o igual que 200"),
  icr: number({ required_error: "La Relación Insulina-Carbohidratos es requerida" })
    .int("El valor debe ser un número entero")
    .min(5, "El valor debe ser mayor o igual que 5")
    .max(20, "El valor debe ser menor o igual que 20"),
  targetLow: number({ required_error: "El límite inferior del rango objetivo es requerido" })
    .int("El valor debe ser un número entero")
    .min(70, "El valor debe ser mayor o igual que 70")
    .max(100, "El valor debe ser menor o igual que 100"),
  targetHigh: number({ required_error: "El límite superior del rango objetivo es requerido" })
    .int("El valor debe ser un número entero")
    .min(120, "El valor debe ser mayor o igual que 120")
    .max(200, "El valor debe ser menor o igual que 200"),
  penIncrement: number({ required_error: "El incremento de la lapicera es requerido" })
    .refine((val) => val === 0.5 || val === 1, {
      message: "El incremento debe ser 0.5 o 1",
    }),
}).refine((data) => data.targetHigh > data.targetLow, {
  message: "El límite superior debe ser mayor que el límite inferior",
  path: ["targetHigh"],
});