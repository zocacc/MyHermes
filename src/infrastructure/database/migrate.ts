import path from "node:path";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { Pool } from "pg";

export async function migrateDatabase(pool: Pool): Promise<void> {
  const migrationsFolder = process.env.MIGRATIONS_FOLDER ?? path.resolve(process.cwd(), "drizzle");
  await migrate(drizzle(pool), { migrationsFolder });
}
