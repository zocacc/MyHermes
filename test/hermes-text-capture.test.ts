import { describe, expect, it } from "vitest";

import { HermesApplication } from "../src/application/hermes-application.js";
import { CaptureProcessor } from "../src/application/capture-processor.js";
import type {
  CaptureJobQueue,
  CaptureStore,
  Interpreter,
  TelegramGateway
} from "../src/application/ports.js";
import type {
  Capture,
  CaptureJob,
  Item,
  ItemDraft,
  TelegramTextUpdate
} from "../src/domain/model.js";

class MemoryStore implements CaptureStore {
  readonly captures: Capture[] = [];
  readonly items: Item[] = [];

  createCapture(capture: Capture): Promise<"created" | "duplicate"> {
    if (this.captures.some((candidate) => candidate.externalUpdateId === capture.externalUpdateId)) {
      return Promise.resolve("duplicate");
    }
    this.captures.push(capture);
    return Promise.resolve("created");
  }

  findCapture(id: string): Promise<Capture | undefined> {
    return Promise.resolve(this.captures.find((capture) => capture.id === id));
  }

  findItemByCaptureId(captureId: string): Promise<Item | undefined> {
    return Promise.resolve(this.items.find((item) => item.captureId === captureId));
  }

  saveItem(item: Item): Promise<void> {
    if (!this.items.some((candidate) => candidate.captureId === item.captureId)) {
      this.items.push(item);
    }
    return Promise.resolve();
  }

  markCaptureCompleted(captureId: string): Promise<void> {
    const capture = this.captures.find((candidate) => candidate.id === captureId);
    if (!capture) throw new Error("capture not found");
    capture.status = "completed";
    return Promise.resolve();
  }
}

class MemoryQueue implements CaptureJobQueue {
  readonly jobs: CaptureJob[] = [];

  enqueue(job: CaptureJob): Promise<void> {
    this.jobs.push(job);
    return Promise.resolve();
  }
}

class RecordingInterpreter implements Interpreter {
  calls = 0;

  interpret(): Promise<ItemDraft> {
    this.calls += 1;
    return Promise.resolve({
      type: "task",
      title: "Comprar café",
      body: "Comprar café amanhã",
      dueAt: "2026-10-15T12:00:00.000Z"
    });
  }
}

class RecordingTelegram implements TelegramGateway {
  readonly confirmations: Item[] = [];
  failuresRemaining = 0;

  sendItemCreated(_chatId: string, item: Item): Promise<void> {
    if (this.failuresRemaining > 0) {
      this.failuresRemaining -= 1;
      return Promise.reject(new Error("Telegram unavailable"));
    }
    this.confirmations.push(item);
    return Promise.resolve();
  }
}

function createHarness() {
  const store = new MemoryStore();
  const queue = new MemoryQueue();
  const interpreter = new RecordingInterpreter();
  const telegram = new RecordingTelegram();
  const ids = ["capture-1", "item-1"];
  const nextId = () => {
    const id = ids.shift();
    if (!id) throw new Error("unexpected id request");
    return id;
  };
  const now = () => new Date("2026-10-14T12:00:00.000Z");

  return {
    app: new HermesApplication({
      allowedTelegramUserId: "42",
      store,
      queue,
      nextId,
      now
    }),
    processor: new CaptureProcessor({ store, interpreter, telegram, nextId, now }),
    store,
    queue,
    interpreter,
    telegram
  };
}

const update: TelegramTextUpdate = {
  updateId: "1001",
  userId: "42",
  chatId: "42",
  text: "Comprar café amanhã",
  locale: "pt-BR",
  timeZone: "America/Sao_Paulo"
};

describe("Hermes text capture seam", () => {
  it("preserves an authorized message, interprets it, persists an Item, and confirms it", async () => {
    const harness = createHarness();

    await expect(harness.app.receiveText(update)).resolves.toEqual({
      status: "accepted",
      captureId: "capture-1"
    });
    expect(harness.queue.jobs).toEqual([{ captureId: "capture-1" }]);

    await harness.processor.process(harness.queue.jobs[0]!);

    expect(harness.store.captures).toEqual([
      expect.objectContaining({
        id: "capture-1",
        externalUpdateId: "1001",
        rawText: "Comprar café amanhã",
        status: "completed"
      })
    ]);
    expect(harness.store.items).toEqual([
      expect.objectContaining({
        id: "item-1",
        captureId: "capture-1",
        type: "task",
        title: "Comprar café"
      })
    ]);
    expect(harness.telegram.confirmations).toEqual(harness.store.items);
  });

  it("rejects a user outside the allowlist before persistence or interpretation", async () => {
    const harness = createHarness();

    await expect(harness.app.receiveText({ ...update, userId: "99" })).resolves.toEqual({
      status: "unauthorized"
    });

    expect(harness.store.captures).toHaveLength(0);
    expect(harness.queue.jobs).toHaveLength(0);
    expect(harness.interpreter.calls).toBe(0);
  });

  it("treats a repeated Telegram update as a duplicate", async () => {
    const harness = createHarness();

    await harness.app.receiveText(update);
    await expect(harness.app.receiveText(update)).resolves.toEqual({ status: "duplicate" });

    expect(harness.store.captures).toHaveLength(1);
    expect(harness.queue.jobs).toEqual([{ captureId: "capture-1" }]);
  });

  it("retries confirmation without interpreting or persisting the Item twice", async () => {
    const harness = createHarness();
    harness.telegram.failuresRemaining = 1;
    await harness.app.receiveText(update);

    await expect(harness.processor.process(harness.queue.jobs[0]!)).rejects.toThrow("Telegram unavailable");
    expect(harness.store.items).toHaveLength(1);
    expect(harness.store.captures[0]?.status).toBe("queued");

    await expect(harness.processor.process(harness.queue.jobs[0]!)).resolves.toBeUndefined();
    expect(harness.interpreter.calls).toBe(1);
    expect(harness.store.items).toHaveLength(1);
    expect(harness.telegram.confirmations).toHaveLength(1);
    expect(harness.store.captures[0]?.status).toBe("completed");
  });
});
