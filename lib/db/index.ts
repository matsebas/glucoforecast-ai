import * as schema from "./schema";

// Configuración inteligente: usar PostgreSQL local si está disponible, sino Neon
const isLocalPostgres = process.env.USE_LOCAL_DB === "true" ||
                       (process.env.DATABASE_URL?.includes("localhost") && !process.env.VERCEL) || 
                       (process.env.DATABASE_URL?.includes("127.0.0.1") && !process.env.VERCEL);

let db: any;

if (isLocalPostgres) {
  // PostgreSQL local para desarrollo
  const { drizzle } = require("drizzle-orm/postgres-js");
  const postgres = require("postgres");
  const client = postgres(process.env.DATABASE_URL!);
  db = drizzle(client, { schema });
} else {
  // Neon para producción/Vercel
  const { neon } = require("@neondatabase/serverless");
  const { drizzle } = require("drizzle-orm/neon-http");
  const sql = neon(process.env.DATABASE_URL!);
  db = drizzle(sql, { schema });
}

export { db };
