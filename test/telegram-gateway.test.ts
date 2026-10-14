import { describe, expect, it, vi } from "vitest";

import {
  createTelegramBot,
  GrammyTelegramGateway
} from "../src/infrastructure/telegram/telegram-bot.js";
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
        "Quando: 2026-10-15T12:00:00.000Z",
        "Ações disponíveis: /help"
      ].join("\n")
    );
  });

  it("drops an unauthorized command before application or Telegram API calls", async () => {
    const receiveText = vi.fn();
    const bot = createTelegramBot({
      token: "test-token",
      application: { receiveText },
      allowedTelegramUserId: "42",
      locale: "pt-BR",
      timeZone: "America/Sao_Paulo"
    });
    bot.botInfo = {
      id: 123,
      is_bot: true,
      first_name: "Hermes",
      username: "hermes_test_bot",
      can_join_groups: false,
      can_read_all_group_messages: false,
      supports_inline_queries: false,
      can_connect_to_business: false,
      has_main_web_app: false,
      has_topics_enabled: false,
      allows_users_to_create_topics: false,
      can_manage_bots: false,
      supports_join_request_queries: false
    };

    await expect(
      bot.handleUpdate({
        update_id: 1002,
        message: {
          message_id: 1,
          date: 1_792_000_000,
          chat: { id: 99, type: "private", first_name: "Intruso" },
          from: { id: 99, is_bot: false, first_name: "Intruso" },
          text: "/help",
          entities: [{ offset: 0, length: 5, type: "bot_command" }]
        }
      })
    ).resolves.toBeUndefined();
    expect(receiveText).not.toHaveBeenCalled();
  });
});
