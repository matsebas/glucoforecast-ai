import { describe, expect, it } from "vitest";

import * as patientSettings from "./patient-settings";
import { patientSettingsSchema } from "./patient-settings";

describe("patientSettingsSchema", () => {
  it("debería validar un objeto de configuración de paciente correcto", () => {
    const validSettings = {
      isf: 50,
      icr: 10,
      targetLow: 80,
      targetHigh: 140,
      penIncrement: 0.5,
    };
    const result = patientSettings.patientSettingsSchema.safeParse(validSettings);
    expect(result.success).toBe(true);
  });

  it("debería aceptar valores válidos en los rangos permitidos", () => {
    const validSettings = {
      isf: 100,
      icr: 15,
      targetLow: 90,
      targetHigh: 160,
      penIncrement: 1,
    };
    const result = patientSettings.patientSettingsSchema.safeParse(validSettings);
    expect(result.success).toBe(true);
  });

  it("debería fallar si isf está fuera del rango permitido", () => {
    const invalidSettings = {
      isf: 300, // Fuera del rango permitido
      icr: 10,
      targetLow: 80,
      targetHigh: 140,
      penIncrement: 0.5,
    };
    const result = patientSettings.patientSettingsSchema.safeParse(invalidSettings);
    expect(result.success).toBe(false);
  });

  it("debería fallar si targetHigh no es mayor que targetLow", () => {
    const invalidSettings = {
      isf: 50,
      icr: 10,
      targetLow: 140,
      targetHigh: 80, // Menor que targetLow
      penIncrement: 0.5,
    };
    const result = patientSettings.patientSettingsSchema.safeParse(invalidSettings);
    expect(result.success).toBe(false);
  });

  it("debería validar todos los campos en los valores mínimos permitidos", () => {
    const minValidSettings = {
      isf: 25,
      icr: 5,
      targetLow: 70,
      targetHigh: 120,
      penIncrement: 0.5,
    };

    const result = patientSettingsSchema.safeParse(minValidSettings);

    expect(result.success).toBe(true);
  });

  it("debería validar todos los campos en los valores máximos permitidos", () => {
    const maxValidSettings = {
      isf: 200,
      icr: 20,
      targetLow: 100,
      targetHigh: 200,
      penIncrement: 1,
    };

    const result = patientSettingsSchema.safeParse(maxValidSettings);

    expect(result.success).toBe(true);
  });

  it("debería fallar cuando isf está por debajo del mínimo", () => {
    const invalidSettings = {
      isf: 24,
      icr: 10,
      targetLow: 80,
      targetHigh: 140,
      penIncrement: 0.5,
    };

    const result = patientSettingsSchema.safeParse(invalidSettings);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("mayor o igual que 25");
  });

  it("debería fallar cuando icr está por encima del máximo", () => {
    const invalidSettings = {
      isf: 50,
      icr: 21,
      targetLow: 80,
      targetHigh: 140,
      penIncrement: 0.5,
    };

    const result = patientSettingsSchema.safeParse(invalidSettings);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("menor o igual que 20");
  });

  it("debería fallar cuando targetLow es mayor que targetHigh", () => {
    const invalidSettings = {
      isf: 50,
      icr: 10,
      targetLow: 90, // Dentro del rango válido para targetLow
      targetHigh: 80, // Menor que targetLow pero fuera del rango mínimo
      penIncrement: 0.5,
    };

    const result = patientSettingsSchema.safeParse(invalidSettings);

    expect(result.success).toBe(false);
    // Buscar el error específico de la validación refine
    const refineError = result.error?.issues.find(
      (issue) => issue.message === "El límite superior debe ser mayor que el límite inferior"
    );
    expect(refineError).toBeDefined();
  });

  it("debería fallar cuando penIncrement no es múltiplo de 0.5", () => {
    const invalidSettings = {
      isf: 50,
      icr: 10,
      targetLow: 80,
      targetHigh: 140,
      penIncrement: 0.3,
    };

    const result = patientSettingsSchema.safeParse(invalidSettings);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("múltiplo de 0.5");
  });

  it("debería fallar cuando faltan campos requeridos", () => {
    const incompleteSettings = {
      isf: 50,
      icr: 10,
      // targetLow y targetHigh faltantes
      penIncrement: 0.5,
    };

    const result = patientSettingsSchema.safeParse(incompleteSettings);

    expect(result.success).toBe(false);
    expect(result.error?.issues.length).toBeGreaterThan(0);
  });

  it("debería fallar cuando los valores no son enteros (excepto penIncrement)", () => {
    const invalidSettings = {
      isf: 50.5, // No entero
      icr: 10,
      targetLow: 80,
      targetHigh: 140,
      penIncrement: 0.5,
    };

    const result = patientSettingsSchema.safeParse(invalidSettings);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("número entero");
  });

  it("debería validar correctamente cuando targetLow y targetHigh están en los límites", () => {
    const edgeCaseSettings = {
      isf: 50,
      icr: 10,
      targetLow: 100, // Máximo para targetLow
      targetHigh: 120, // Mínimo para targetHigh
      penIncrement: 0.5,
    };

    const result = patientSettingsSchema.safeParse(edgeCaseSettings);

    expect(result.success).toBe(true);
  });

  it("debería fallar con múltiples errores de validación", () => {
    const multipleErrorsSettings = {
      isf: 300, // Fuera de rango
      icr: 2, // Fuera de rango
      targetLow: 60, // Fuera de rango
      targetHigh: 250, // Fuera de rango
      penIncrement: 2, // Fuera de rango
    };

    const result = patientSettingsSchema.safeParse(multipleErrorsSettings);

    expect(result.success).toBe(false);
    expect(result.error?.issues.length).toBeGreaterThan(1);
  });

  it("debería fallar cuando los tipos de datos son incorrectos", () => {
    const wrongTypesSettings = {
      isf: "50", // String en lugar de number
      icr: 10,
      targetLow: 80,
      targetHigh: 140,
      penIncrement: 0.5,
    };

    const result = patientSettingsSchema.safeParse(wrongTypesSettings);

    expect(result.success).toBe(false);
  });
});
