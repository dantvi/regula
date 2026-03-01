import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { loadConfig } from "@regula/config";
import * as schema from "./schema";

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (!db) {
    const config = loadConfig();
    pool = new Pool({ connectionString: config.databaseUrl });
    db = drizzle({ client: pool, schema });
  }
  return db;
}

export async function checkDbConnection(): Promise<boolean> {
  try {
    if (!pool) getDb();
    await pool!.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
