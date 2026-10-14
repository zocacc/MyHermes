import "dotenv/config";

import { Pool } from "pg";

import { loadConfig } from "../../config.js";
import { migrateDatabase } from "./migrate.js";

const config = loadConfig();
const pool = new Pool({ connectionString: config.databaseUrl });

try {
  await migrateDatabase(pool);
} finally {
  await pool.end();
}
