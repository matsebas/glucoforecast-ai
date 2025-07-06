import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

type NeonDb = ReturnType<typeof drizzleNeon>;
type PostgresDb = ReturnType<typeof drizzlePostgres>;
type DB = NeonDb | PostgresDb;

// Configuración para usar Postgres local si está disponible, si no Neon
const isLocalPostgres =
  process.env.USE_LOCAL_DB === "true" ||
  (process.env.DATABASE_URL?.includes("localhost") && !process.env.VERCEL) ||
  (process.env.DATABASE_URL?.includes("127.0.0.1") && !process.env.VERCEL);

let db: DB;

if (isLocalPostgres) {
  const client = postgres(process.env.DATABASE_URL!);
  db = drizzlePostgres(client, { schema });
} else {
  const sql = neon(process.env.DATABASE_URL!);
  db = drizzleNeon(sql, { schema });
}

export { db };
