import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import type { Pool } from "pg";

import type { CaptureStore } from "../../application/ports.js";
import type { Capture, Item } from "../../domain/model.js";
import { captures, items } from "./schema.js";

export class PostgresCaptureStore implements CaptureStore {
  private readonly database;

  constructor(pool: Pool) {
    this.database = drizzle(pool);
  }

  async createCapture(capture: Capture): Promise<"created" | "duplicate"> {
    const inserted = await this.database
      .insert(captures)
      .values(capture)
      .onConflictDoNothing({ target: captures.externalUpdateId })
      .returning({ id: captures.id });

    return inserted.length === 1 ? "created" : "duplicate";
  }

  async findCapture(id: string): Promise<Capture | undefined> {
    const [capture] = await this.database.select().from(captures).where(eq(captures.id, id)).limit(1);
    if (!capture) return undefined;

    if (capture.kind !== "text") {
      throw new Error(`Unsupported capture kind: ${capture.kind}`);
    }

    return {
      ...capture,
      kind: "text",
      receivedAt: new Date(capture.receivedAt).toISOString()
    };
  }

  async findItemByCaptureId(captureId: string): Promise<Item | undefined> {
    const [item] = await this.database.select().from(items).where(eq(items.captureId, captureId)).limit(1);
    if (!item) return undefined;

    return {
      ...item,
      dueAt: item.dueAt ? new Date(item.dueAt).toISOString() : null,
      createdAt: new Date(item.createdAt).toISOString()
    };
  }

  async saveItem(item: Item): Promise<void> {
    await this.database.insert(items).values(item).onConflictDoNothing({ target: items.captureId });
  }

  async markCaptureCompleted(captureId: string): Promise<void> {
    await this.database
      .update(captures)
      .set({ status: "completed" })
      .where(eq(captures.id, captureId));
  }
}
