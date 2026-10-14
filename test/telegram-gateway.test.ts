import { describe, expect, it, vi } from "vitest";

import { GrammyTelegramGateway } from "../src/infrastructure/telegram/telegram-bot.js";
import type { Item } from "../src/domain/model.js";

describe("GrammyTelegramGateway", () => {
  it("renders the created Item and exposes only implemented actions", async () => {
    const sendMessage = vi.fn().mockResolvedValue({});
    const gateway = new GrammyTelegramGateway({ sendMessage });
    const item: Item = {
      id: "item-1",
      captureId: "capture-1",
      type: "task",
      title: "Comprar café",
      body: "Comprar café amanhã",
      dueAt: "2026-10-15T12:00:00.000Z",
      status: "active",
      createdAt: "2026-10-14T12:00:01.000Z"
    };

    await gateway.sendItemCreated("42", item);

    expect(sendMessage).toHaveBeenCalledWith(
      "42",
      [
        "Tarefa: Comprar café",
        "Comprar café amanhã",
        "",
        "Quando: 2026-10-15T12:00:00.000Z",
        "Ações disponíveis: /help"
      ].join("\n")
    );
  });
});
