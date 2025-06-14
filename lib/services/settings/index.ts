import { eq } from "drizzle-orm";
/* eslint-disable no-unused-vars */
import { ZodError } from "zod";

import { db } from "@/lib/db";
import { patientSettings } from "@/lib/db/schema";
import { patientSettingsSchema } from "@/lib/validations/patient-settings";

export type PatientSettings = {
  isf: number;
  icr: number;
  targetLow: number;
  targetHigh: number;
};

/**
 * Valida y parsea los datos de configuración del paciente desde un objeto JSON
 * @param data Objeto JSON con los datos a validar
 * @returns Datos validados y parseados
 * @throws {ZodError} Si los datos no son válidos
 */
export function parsePatientSettings(data: unknown): PatientSettings {
  return patientSettingsSchema.parse(data);
}

/**
 * Obtiene la configuración de parámetros del paciente
 * @param userId ID del usuario
 * @returns Configuración del paciente
 * @throws Error si no existe configuración para el usuario
 */
export async function getPatientSettings(userId: string): Promise<PatientSettings> {
  // Obtener configuración del paciente
  const settings = await db.query.patientSettings.findFirst({
    where: eq(patientSettings.userId, userId),
  });

  // Si no hay configuración, lanzar error
  if (!settings) {
    throw new Error("PATIENT_SETTINGS_NOT_CONFIGURED");
  }

  return {
    isf: settings.isf,
    icr: settings.icr,
    targetLow: settings.targetLow,
    targetHigh: settings.targetHigh,
  };
}

/**
 * Guarda la configuración de parámetros del paciente usando un objeto de configuración
 * @param userId ID del usuario
 * @param settings Objeto con la configuración a guardar
 */
export async function savePatientSettingsFromObject(
  userId: string,
  settings: PatientSettings
): Promise<void> {
  return savePatientSettings(
    userId,
    settings.isf,
    settings.icr,
    settings.targetLow,
    settings.targetHigh
  );
}

/**
 * Guarda la configuración de parámetros del paciente
 * Utiliza onConflictDoUpdate para realizar la operación en una sola consulta a la base de datos,
 * lo que mejora la eficiencia al evitar consultas separadas para verificar la existencia del registro.
 *
 * @param userId ID del usuario
 * @param isf Factor de Sensibilidad a la Insulina
 * @param icr Relación Insulina-Carbohidratos
 * @param targetLow Límite inferior del rango objetivo
 * @param targetHigh Límite superior del rango objetivo
 */
export async function savePatientSettings(
  userId: string,
  isf: number,
  icr: number,
  targetLow: number,
  targetHigh: number
): Promise<void> {
  // Crear o actualizar configuración en una sola operación
  await db
    .insert(patientSettings)
    .values({
      userId,
      isf,
      icr,
      targetLow,
      targetHigh,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [patientSettings.userId],
      set: {
        isf,
        icr,
        targetLow,
        targetHigh,
        updatedAt: new Date(),
      },
    });
}
