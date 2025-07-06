import { describe, expect, it } from "vitest";

import { CsvFileRecord } from "../../types";

import {
  parseCsvFileRecord,
  parseCsvFileRecords,
  parseGlucoseReading,
  parseGlucoseReadings,
} from "./parsers";

// Helper para crear objetos CsvFileRecord completos
function createCsvFileRecord(partial: Partial<CsvFileRecord>): CsvFileRecord {
  return {
    timestamp: "01-01-2024 10:30",
    recordType: "0",
    device: "Test Device",
    serialNumber: "12345",
    historicGlucose: null,
    scannedGlucose: null,
    rapidInsulin: null,
    longInsulin: null,
    carbs: null,
    notes: null,
    rapidInsulinNonNumeric: null,
    foodNonNumeric: null,
    carbPortions: null,
    longInsulinNonNumeric: null,
    glucoseBand: null,
    ketone: null,
    mealInsulin: null,
    correctionInsulin: null,
    userChangeInsulin: null,
    ...partial,
  };
}

describe("parseCsvFileRecord", () => {
  const userId = "test-user-id";

  it("debería parsear correctamente un registro de historial de glucosa", () => {
    const csvRecord = createCsvFileRecord({
      recordType: "0",
      historicGlucose: 120,
    });

    const result = parseCsvFileRecord(csvRecord, userId);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.glucose).toBe(120);
    expect(result.data?.recordType).toBe("0");
    expect(result.data?.userId).toBe(userId);
  });

  it("debería parsear correctamente un registro de glucosa escaneada", () => {
    const csvRecord = createCsvFileRecord({
      recordType: "1",
      scannedGlucose: 110,
    });

    const result = parseCsvFileRecord(csvRecord, userId);

    expect(result.success).toBe(true);
    expect(result.data?.glucose).toBe(110);
    expect(result.data?.recordType).toBe("1");
  });

  it("debería parsear correctamente un registro de insulina", () => {
    const csvRecord = createCsvFileRecord({
      recordType: "4",
      rapidInsulin: 5,
      longInsulin: 10,
    });

    const result = parseCsvFileRecord(csvRecord, userId);

    expect(result.success).toBe(true);
    expect(result.data?.rapidInsulin).toBe(5);
    expect(result.data?.longInsulin).toBe(10);
    expect(result.data?.recordType).toBe("4");
  });

  it("debería parsear correctamente un registro de carbohidratos", () => {
    const csvRecord = createCsvFileRecord({
      recordType: "5",
      carbs: 45,
    });

    const result = parseCsvFileRecord(csvRecord, userId);

    expect(result.success).toBe(true);
    expect(result.data?.carbs).toBe(45);
    expect(result.data?.recordType).toBe("5");
  });

  it("debería parsear correctamente un registro de notas", () => {
    const csvRecord = createCsvFileRecord({
      recordType: "6",
      notes: "Ejercicio intenso",
    });

    const result = parseCsvFileRecord(csvRecord, userId);

    expect(result.success).toBe(true);
    expect(result.data?.notes).toBe("Ejercicio intenso");
    expect(result.data?.recordType).toBe("6");
  });

  it("debería fallar con fecha inválida", () => {
    const csvRecord = createCsvFileRecord({
      timestamp: "fecha-invalida",
      recordType: "0",
      historicGlucose: 120,
    });

    const result = parseCsvFileRecord(csvRecord, userId);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Fecha inválida");
  });

  it("debería fallar con tipo de registro desconocido", () => {
    const csvRecord = createCsvFileRecord({
      recordType: "99",
    });

    const result = parseCsvFileRecord(csvRecord, userId);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Tipo de registro no reconocido");
  });

  it("debería fallar cuando falta el valor requerido para el tipo de registro", () => {
    const csvRecord = createCsvFileRecord({
      recordType: "0", // Historial de glucosa
      historicGlucose: null, // Falta el valor requerido
    });

    const result = parseCsvFileRecord(csvRecord, userId);

    expect(result.success).toBe(false);
    expect(result.error).toContain("sin valor de glucosa");
  });

  it("debería parsear fecha en formato ISO estándar", () => {
    const csvRecord = createCsvFileRecord({
      timestamp: "2024-01-01T10:30:00Z",
      recordType: "0",
      historicGlucose: 120,
    });

    const result = parseCsvFileRecord(csvRecord, userId);

    expect(result.success).toBe(true);
    expect(result.data?.timestamp).toBeInstanceOf(Date);
  });
});

describe("parseGlucoseReading", () => {
  const userId = "test-user-id";
  const patientConnection = {
    patientDevice: { did: "device-123" },
    sensor: { sn: "sensor-456" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  it("debería parsear correctamente una lectura de glucosa de API", () => {
    const reading = {
      timestamp: "2024-01-01T10:30:00Z",
      value: 125,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const result = parseGlucoseReading(reading, userId, patientConnection);

    expect(result.success).toBe(true);
    expect(result.data?.glucose).toBe(125);
    expect(result.data?.recordType).toBe("1"); // Siempre escaneada para API
    expect(result.data?.device).toBe("device-123");
    expect(result.data?.serialNumber).toBe("sensor-456");
  });

  it("debería fallar con timestamp inválido", () => {
    const reading = {
      timestamp: "fecha-invalida",
      value: 125,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const result = parseGlucoseReading(reading, userId, patientConnection);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Fecha inválida desde API");
  });

  it("debería manejar sensor sin número de serie", () => {
    const patientConnectionNoSN = {
      patientDevice: { did: "device-123" },
      sensor: { sn: null },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const reading = {
      timestamp: "2024-01-01T10:30:00Z",
      value: 125,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const result = parseGlucoseReading(reading, userId, patientConnectionNoSN);

    expect(result.success).toBe(true);
    expect(result.data?.serialNumber).toBe("Unknown");
  });
});

describe("parseCsvFileRecords", () => {
  const userId = "test-user-id";

  it("debería parsear múltiples registros correctamente", () => {
    const csvRecords: CsvFileRecord[] = [
      createCsvFileRecord({
        recordType: "0",
        historicGlucose: 120,
      }),
      createCsvFileRecord({
        timestamp: "01-01-2024 11:30",
        recordType: "1",
        scannedGlucose: 110,
      }),
    ];

    const result = parseCsvFileRecords(csvRecords, userId);

    expect(result.records).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
    expect(result.records[0].glucose).toBe(120);
    expect(result.records[1].glucose).toBe(110);
  });

  it("debería separar registros válidos de errores", () => {
    const csvRecords: CsvFileRecord[] = [
      createCsvFileRecord({
        recordType: "0",
        historicGlucose: 120,
      }),
      createCsvFileRecord({
        timestamp: "fecha-invalida",
        recordType: "0",
        historicGlucose: 110,
      }),
    ];

    const result = parseCsvFileRecords(csvRecords, userId);

    expect(result.records).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.records[0].glucose).toBe(120);
    expect(result.errors[0]).toContain("Fecha inválida");
  });
});

describe("parseGlucoseReadings", () => {
  const userId = "test-user-id";
  const patientConnection = {
    patientDevice: { did: "device-123" },
    sensor: { sn: "sensor-456" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  it("debería parsear múltiples lecturas correctamente", () => {
    const readings = [
      { timestamp: "2024-01-01T10:30:00Z", value: 125 },
      { timestamp: "2024-01-01T11:30:00Z", value: 130 },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any[];

    const result = parseGlucoseReadings(readings, userId, patientConnection);

    expect(result.records).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
    expect(result.records[0].glucose).toBe(125);
    expect(result.records[1].glucose).toBe(130);
  });

  it("debería separar lecturas válidas de errores", () => {
    const readings = [
      { timestamp: "2024-01-01T10:30:00Z", value: 125 },
      { timestamp: "fecha-invalida", value: 130 },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any[];

    const result = parseGlucoseReadings(readings, userId, patientConnection);

    expect(result.records).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.records[0].glucose).toBe(125);
    expect(result.errors[0]).toContain("Fecha inválida desde API");
  });
});