import { Bot, type Api } from "grammy";

import type { HermesApplication } from "../../application/hermes-application.js";
import type { TelegramGateway } from "../../application/ports.js";
import type { Item } from "../../domain/model.js";

export class GrammyTelegramGateway implements TelegramGateway {
  constructor(private readonly api: Pick<Api, "sendMessage">) {}

  async sendItemCreated(chatId: string, item: Item): Promise<void> {
    const dueLine = item.dueAt ? `Quando: ${item.dueAt}` : "";
    await this.api.sendMessage(
      chatId,
      [`${labelFor(item.type)}: ${item.title}`, item.body, dueLine, "Ações disponíveis: /help"]
        .filter(Boolean)
        .join("\n")
    );
  }
}

interface TelegramBotOptions {
  token: string;
  application: Pick<HermesApplication, "receiveText">;
  allowedTelegramUserId: string;
  locale: string;
  timeZone: string;
}

export function createTelegramBot(options: TelegramBotOptions): Bot {
  const bot = new Bot(options.token);

  bot.use(async (context, next) => {
    if (String(context.from?.id) !== options.allowedTelegramUserId) return;
    await next();
  });

  bot.command(["start", "help"], async (context) => {
    await context.reply("Envie uma mensagem de texto para criar uma Nota, Tarefa ou Lembrete.");
  });

  bot.on("message:text", async (context) => {
    await options.application.receiveText({
      updateId: String(context.update.update_id),
      userId: String(context.from.id),
      chatId: String(context.chat.id),
      text: context.message.text,
      locale: context.from.language_code ?? options.locale,
      timeZone: options.timeZone
    });
  });

  return bot;
}

function labelFor(type: Item["type"]): string {
  switch (type) {
    case "note":
      return "Nota";
    case "task":
      return "Tarefa";
    case "reminder":
      return "Lembrete";
  }
}
