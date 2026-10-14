import type { Capture, CaptureJob, Item, ItemDraft } from "../domain/model.js";

export interface CaptureStore {
  createCapture(capture: Capture): Promise<"created" | "duplicate">;
  findCapture(id: string): Promise<Capture | undefined>;
  completeCapture(captureId: string, item: Item): Promise<void>;
}

export interface CaptureJobQueue {
  enqueue(job: CaptureJob): Promise<void>;
}

export interface InterpretationInput {
  text: string;
  locale: string;
  timeZone: string;
  receivedAt: string;
}

export interface Interpreter {
  interpret(input: InterpretationInput): Promise<ItemDraft>;
}

export interface TelegramGateway {
  sendItemCreated(chatId: string, item: Item): Promise<void>;
}
