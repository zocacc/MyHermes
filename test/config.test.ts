import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { loadConfig } from "../src/config.js";

const requiredEnvironment = {
  DATABASE_URL: "postgres://hermes:hermes@localhost:5432/hermes",
  TELEGRAM_BOT_TOKEN: "telegram-token",
  TELEGRAM_ALLOWED_USER_ID: "42",
  OPENAI_API_KEY: "openai-key",
  OPENAI_INTERPRETATION_MODEL: "configured-model"
};

describe("configuration", () => {
  it("loads required secrets and safe local defaults", () => {
    expect(loadConfig(requiredEnvironment)).toEqual({
      databaseUrl: requiredEnvironment.DATABASE_URL,
      telegramBotToken: requiredEnvironment.TELEGRAM_BOT_TOKEN,
      allowedTelegramUserId: "42",
      openAiApiKey: requiredEnvironment.OPENAI_API_KEY,
      interpretationModel: "configured-model",
      locale: "pt-BR",
      timeZone: "America/Sao_Paulo",
      port: 3000
    });
  });

  it("fails before startup when required configuration is missing or malformed", () => {
    expect(() => loadConfig({ ...requiredEnvironment, TELEGRAM_ALLOWED_USER_ID: "not-an-id" })).toThrow(
      ZodError
    );
    expect(() => loadConfig({ ...requiredEnvironment, OPENAI_API_KEY: "" })).toThrow(ZodError);
  });
});
