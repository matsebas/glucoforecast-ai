import { AdapterAccountType } from "@auth/core/adapters";
import {
  doublePrecision,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  emailVerified: timestamp("email_verified_at", { withTimezone: true }).defaultNow(),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    {
      compoundKey: primaryKey({
        columns: [account.provider, account.providerAccountId],
      }),
    },
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationToken = pgTable(
  "verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (verificationToken) => [
    {
      compositePk: primaryKey({
        columns: [verificationToken.identifier, verificationToken.token],
      }),
    },
  ]
);

export const csvRecords = pgTable(
  "csv_records",
  {
    id: serial("id").primaryKey(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    glucose: doublePrecision("glucose").default(0).notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
    recordType: varchar("record_type", { length: 2 }).notNull(),
    rapidInsulin: doublePrecision("rapid_insulin"),
    longInsulin: doublePrecision("long_insulin"),
    carbs: doublePrecision("carbs"),
    notes: text("notes"),
    device: varchar("device", { length: 255 }),
    serialNumber: varchar("serial_number", { length: 255 }),
  },
  (table) => {
    return {
      uniqTimestampType: uniqueIndex("csv_records_timestamp_type_idx").on(
        table.userId,
        table.timestamp,
        table.recordType
      ),
    };
  }
);

export const uploadedFiles = pgTable("uploaded_files", {
  id: serial("id").primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  originalFilename: text("original_filename").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  recordsProcessed: integer("records_processed").default(0).notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
});

export const patientSettings = pgTable("patient_settings", {
  id: serial("id").primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  isf: integer("isf").notNull().default(100),
  icr: integer("icr").notNull().default(10),
  targetLow: integer("target_low").notNull().default(70),
  targetHigh: integer("target_high").notNull().default(180),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
