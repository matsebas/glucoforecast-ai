import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

// Inicializar el cliente SQL de Neon
const sql = neon(process.env.DATABASE_URL!)

// Crear la instancia de Drizzle con el esquema
export const db = drizzle(sql, { schema })
