import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { loadConfig } from "@regula/config";
import * as schema from "./schema";

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!db) {
    const config = loadConfig();
    pool = new Pool({
      connectionString: config.databaseUrl,
    });
    db = drizzle(pool, { schema });
  }
  return db;
}

export async function checkDbConnection(): Promise<boolean> {
  try {
    if (!pool) {
      getDb(); // Initialize pool
    }
    await pool!.query("SELECT 1");
    return true;
  } catch (error) {
    console.error("Database connection check failed:", error);
    return false;
  }
}

export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}
