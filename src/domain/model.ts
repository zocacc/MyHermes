export type CaptureStatus = "queued" | "processing" | "completed" | "needs_review" | "failed";

export type ItemType = "note" | "task" | "reminder";

export interface TelegramTextUpdate {
  updateId: string;
  userId: string;
  chatId: string;
  text: string;
  locale: string;
  timeZone: string;
}

export interface Capture {
  id: string;
  externalUpdateId: string;
  userId: string;
  chatId: string;
  kind: "text";
  rawText: string;
  locale: string;
  timeZone: string;
  status: CaptureStatus;
  receivedAt: string;
}

export interface ItemDraft {
  type: ItemType;
  title: string;
  body: string;
  dueAt: string | null;
}

export interface Item extends ItemDraft {
  id: string;
  captureId: string;
  status: "active";
  createdAt: string;
}

export interface CaptureJob {
  captureId: string;
}
