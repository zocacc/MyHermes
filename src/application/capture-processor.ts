import type { CaptureJob, Item } from "../domain/model.js";
import type { CaptureStore, Interpreter, TelegramGateway } from "./ports.js";

interface CaptureProcessorDependencies {
  store: CaptureStore;
  interpreter: Interpreter;
  telegram: TelegramGateway;
  nextId: () => string;
  now: () => Date;
}

export class CaptureProcessor {
  constructor(private readonly dependencies: CaptureProcessorDependencies) {}

  async process(job: CaptureJob): Promise<void> {
    const capture = await this.dependencies.store.findCapture(job.captureId);
    if (!capture || capture.status === "completed") {
      return;
    }

    let item = await this.dependencies.store.findItemByCaptureId(capture.id);
    if (!item) {
      const draft = await this.dependencies.interpreter.interpret({
        text: capture.rawText,
        locale: capture.locale,
        timeZone: capture.timeZone,
        receivedAt: capture.receivedAt
      });
      item = {
        ...draft,
        id: this.dependencies.nextId(),
        captureId: capture.id,
        status: "active",
        createdAt: this.dependencies.now().toISOString()
      } satisfies Item;
      await this.dependencies.store.saveItem(item);
    }

    await this.dependencies.telegram.sendItemCreated(capture.chatId, item);
    await this.dependencies.store.markCaptureCompleted(capture.id);
  }
}
