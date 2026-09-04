import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../config.js";
import * as schema from "./schema.js";

let client: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb(databaseUrl: string = env.DATABASE_URL) {
  if (!dbInstance) {
    client = postgres(databaseUrl, { prepare: false });
    dbInstance = drizzle(client, { schema });
  }
  return dbInstance;
}

export const db = getDb();
export type Database = ReturnType<typeof getDb>;

