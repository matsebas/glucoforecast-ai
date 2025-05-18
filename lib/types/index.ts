import { csvRecords } from "@/lib/db/schema";

export type CsvRecord = typeof csvRecords.$inferSelect;
export type NewCsvRecord = typeof csvRecords.$inferInsert;

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
}

export interface GlucoseMetrics {
  timeInRange: number;
  timeBelowRange: number;
  timeAboveRange: number;
  averageGlucose: number;
  variability?: number;
}

export interface GlucoseAnalysis {
  readings: CsvRecord[];
  metrics: GlucoseMetrics;
  recentReadingsText: string;
  metricsText: string;
}
