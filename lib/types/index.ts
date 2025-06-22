import { LibreConnection, LibreResponse } from "libre-link-unofficial-api/dist/types";

import { csvRecords, glucoseMetrics } from "@/lib/db/schema";

export type CsvRecord = typeof csvRecords.$inferSelect;
export type NewCsvRecord = typeof csvRecords.$inferInsert;

export type GlucoseMetricsRecord = typeof glucoseMetrics.$inferSelect;
export type NewGlucoseMetricsRecord = typeof glucoseMetrics.$inferInsert;

export interface CsvFileRecord {
  device: string;
  serialNumber: string;
  timestamp: string;
  recordType: string;
  historicGlucose: number | null;
  scannedGlucose: number | null;
  rapidInsulinNonNumeric: string | null;
  rapidInsulin: number | null;
  foodNonNumeric: string | null;
  carbs: number | null;
  carbPortions: number | null;
  longInsulinNonNumeric: string | null;
  longInsulin: number | null;
  notes: string | null;
  glucoseBand: number | null;
  ketone: number | null;
  mealInsulin: number | null;
  correctionInsulin: number | null;
  userChangeInsulin: number | null;
}

export interface UploadedFile {
  id: number;
  userId: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  recordsProcessed: number;
  uploadedAt: Date;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  count?: number;
  fileId?: number;
  totalProcessed?: number;
}

export interface GlucoseMetrics {
  timeInRange: number;
  timeBelowRange: number;
  timeAboveRange: number;
  averageGlucose: number;
  variability?: number;
}

export type TimePeriod = "day" | "7days" | "14days" | "30days" | "90days" | "all";

export interface GlucoseAnalysis {
  readings: CsvRecord[];
  metrics: GlucoseMetrics;
  recentReadingsText: string;
  metricsText: string;
  timePeriod?: TimePeriod;
}

export interface MultiPeriodGlucoseAnalysis {
  day?: GlucoseAnalysis;
  "7days"?: GlucoseAnalysis;
  "14days"?: GlucoseAnalysis;
  "30days"?: GlucoseAnalysis;
  "90days"?: GlucoseAnalysis;
  all?: GlucoseAnalysis;
}

interface Ticket {
  token: string;
  expires: number;
  duration: number;
}

export interface LibreConnectionsResponse extends LibreResponse {
  status: number;
  data: LibreConnection[];
  ticket: Ticket;
}

export interface LibreUserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  connections: LibreConnection[];
}
