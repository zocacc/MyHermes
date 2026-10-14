import type { Capture, TelegramTextUpdate } from "../domain/model.js";
import type { CaptureJobQueue, CaptureStore } from "./ports.js";

export type ReceiveTextResult =
  | { status: "accepted"; captureId: string }
  | { status: "duplicate" }
  | { status: "unauthorized" };

interface HermesApplicationDependencies {
  allowedTelegramUserId: string;
  store: CaptureStore;
  queue: CaptureJobQueue;
  nextId: () => string;
  now: () => Date;
}

export class HermesApplication {
  constructor(private readonly dependencies: HermesApplicationDependencies) {}

  async receiveText(update: TelegramTextUpdate): Promise<ReceiveTextResult> {
    if (update.userId !== this.dependencies.allowedTelegramUserId) {
      return { status: "unauthorized" };
    }

    const capture: Capture = {
      id: this.dependencies.nextId(),
      externalUpdateId: update.updateId,
      userId: update.userId,
      chatId: update.chatId,
      kind: "text",
      rawText: update.text,
      locale: update.locale,
      timeZone: update.timeZone,
      status: "queued",
      receivedAt: this.dependencies.now().toISOString()
    };

    const result = await this.dependencies.store.createCapture(capture);
    if (result === "duplicate") {
      return { status: "duplicate" };
    }

    await this.dependencies.queue.enqueue({ captureId: capture.id });
    return { status: "accepted", captureId: capture.id };
  }
}
