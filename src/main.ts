import "dotenv/config";

import { randomUUID } from "node:crypto";

import Fastify from "fastify";
import { PgBoss } from "pg-boss";
import { Pool } from "pg";

import { CaptureProcessor } from "./application/capture-processor.js";
import { HermesApplication } from "./application/hermes-application.js";
import { loadConfig } from "./config.js";
import { migrateDatabase } from "./infrastructure/database/migrate.js";
import { PostgresCaptureStore } from "./infrastructure/database/postgres-capture-store.js";
import { OpenAiInterpreter } from "./infrastructure/interpreter/openai-interpreter.js";
import { PgBossCaptureQueue } from "./infrastructure/jobs/pg-boss-capture-queue.js";
import { createTelegramBot, GrammyTelegramGateway } from "./infrastructure/telegram/telegram-bot.js";

const config = loadConfig();
const pool = new Pool({ connectionString: config.databaseUrl });
await migrateDatabase(pool);

const boss = new PgBoss(config.databaseUrl);
boss.on("error", (error) => console.error("pg-boss error", error));
await boss.start();

const store = new PostgresCaptureStore(pool);
const queue = new PgBossCaptureQueue(boss);
const now = () => new Date();
const nextId = () => randomUUID();

const application = new HermesApplication({
  allowedTelegramUserId: config.allowedTelegramUserId,
  store,
  queue,
  nextId,
  now
});
const bot = createTelegramBot({
  token: config.telegramBotToken,
  application,
  locale: config.locale,
  timeZone: config.timeZone
});
const telegramGateway = new GrammyTelegramGateway(bot.api);

const processor = new CaptureProcessor({
  store,
  interpreter: new OpenAiInterpreter(config.openAiApiKey, config.interpretationModel),
  telegram: telegramGateway,
  nextId,
  now
});
await queue.start((job) => processor.process(job));

const server = Fastify({ logger: true });
server.get("/health", () => ({ status: "ok" }));
server.get("/ready", async (_request, reply) => {
  try {
    await pool.query("SELECT 1");
    return { status: "ready" };
  } catch {
    return reply.code(503).send({ status: "not_ready" });
  }
});

await server.listen({ port: config.port, host: "0.0.0.0" });
void bot.start({
  allowed_updates: ["message"],
  onStart: ({ username }) => server.log.info({ username }, "Telegram polling started")
});

async function shutdown(signal: string): Promise<void> {
  server.log.info({ signal }, "Shutting down Hermes");
  await bot.stop();
  await server.close();
  await boss.stop();
  await pool.end();
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void shutdown(signal).finally(() => process.exit(0));
  });
}
