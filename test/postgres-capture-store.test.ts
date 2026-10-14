import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PgBoss } from "pg-boss";
import { Pool } from "pg";

import { migrateDatabase } from "../src/infrastructure/database/migrate.js";
import { PostgresCaptureStore } from "../src/infrastructure/database/postgres-capture-store.js";
import type { Capture, Item } from "../src/domain/model.js";
import { PgBossCaptureQueue } from "../src/infrastructure/jobs/pg-boss-capture-queue.js";

describe("PostgresCaptureStore", () => {
  let container: StartedPostgreSqlContainer;
  let pool: Pool;
  let store: PostgresCaptureStore;
  let boss: PgBoss | undefined;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:17-alpine").start();
    pool = new Pool({ connectionString: container.getConnectionUri() });
    await migrateDatabase(pool);
    store = new PostgresCaptureStore(pool);
  }, 60_000);

  beforeEach(async () => {
    await pool.query("TRUNCATE TABLE items, captures");
  });

  afterAll(async () => {
    await boss?.stop();
    await pool?.end();
    await container?.stop();
  });

  it("persists the original Capture and rejects a duplicate Telegram update", async () => {
    const capture = buildCapture();

    await expect(store.createCapture(capture)).resolves.toBe("created");
    await expect(store.createCapture({ ...capture, id: "capture-2" })).resolves.toBe("duplicate");

    await expect(store.findCapture(capture.id)).resolves.toEqual(capture);
  });

  it("persists one Item per Capture and marks the Capture completed separately", async () => {
    const capture = buildCapture();
    const item: Item = {
      id: "item-1",
      captureId: capture.id,
      type: "task",
      title: "Comprar café",
      body: "Comprar café amanhã",
      dueAt: "2026-10-15T12:00:00.000Z",
      status: "active",
      createdAt: "2026-10-14T12:00:01.000Z"
    };
    await store.createCapture(capture);

    await store.saveItem(item);
    await store.saveItem({ ...item, id: "item-duplicate" });

    await expect(store.findItemByCaptureId(capture.id)).resolves.toEqual(item);
    await store.markCaptureCompleted(capture.id);

    await expect(store.findCapture(capture.id)).resolves.toEqual({
      ...capture,
      status: "completed"
    });
    const result = await pool.query("SELECT id, capture_id, type, title FROM items");
    expect(result.rows).toEqual([
      { id: "item-1", capture_id: "capture-1", type: "task", title: "Comprar café" }
    ]);
  });

  it("delivers a Capture job through the PostgreSQL-backed queue", async () => {
    boss = new PgBoss(container.getConnectionUri());
    await boss.start();
    const queue = new PgBossCaptureQueue(boss);
    let resolveDelivery: ((job: { captureId: string }) => void) | undefined;
    const delivered = new Promise<{ captureId: string }>((resolve) => {
      resolveDelivery = resolve;
    });
    await queue.start((job) => {
      resolveDelivery?.(job);
      return Promise.resolve();
    });

    await queue.enqueue({ captureId: "capture-queued" });

    await expect(delivered).resolves.toEqual({ captureId: "capture-queued" });
  }, 10_000);
});

function buildCapture(): Capture {
  return {
    id: "capture-1",
    externalUpdateId: "1001",
    userId: "42",
    chatId: "42",
    kind: "text",
    rawText: "Comprar café amanhã",
    locale: "pt-BR",
    timeZone: "America/Sao_Paulo",
    status: "queued",
    receivedAt: "2026-10-14T12:00:00.000Z"
  };
}
