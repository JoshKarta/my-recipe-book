import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";

/**
 * Singleton instances to prevent multiple pools during hot reloads
 */
let pool: Pool | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (dbInstance) return dbInstance;

  // Prevent usage in the browser
  if (typeof window !== "undefined") {
    throw new Error(
      "❌ Database connection cannot be established in the browser.",
    );
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("❌ DATABASE_URL is not set");
  }

  try {
    if (!pool) {
      pool = new Pool({
        connectionString: databaseUrl,
        ssl: process.env.DATABASE_SSL === "true",
        // ssl:
        //   process.env.NODE_ENV === "production"
        //     ? { rejectUnauthorized: false }
        //     : false,
      });
    }

    dbInstance = drizzle(pool, { schema });
    return dbInstance;
  } catch (error) {
    console.error("❌ Failed to initialize Railway Postgres:", error);
    throw error;
  }
}

/**
 * Exported singleton
 */
export const db = getDb();
