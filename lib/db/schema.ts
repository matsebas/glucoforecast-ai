import { pgTable, serial, text, timestamp, varchar, integer, boolean } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
})

export const glucoseReadings = pgTable("glucose_readings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  value: integer("value").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  trend: text("trend"),
  notes: text("notes"),
})

export const apiCredentials = pgTable("api_credentials", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  provider: text("provider").notNull(),
  username: text("username"),
  password: text("password"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
})

export const uploadedFiles = pgTable("uploaded_files", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  filename: text("filename").notNull(),
  fileUrl: text("file_url"),
  processed: boolean("processed").default(false),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
})
