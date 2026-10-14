import { z } from "zod";

const environmentSchema = z.object({
  DATABASE_URL: z.url(),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_ALLOWED_USER_ID: z.string().regex(/^\d+$/),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_INTERPRETATION_MODEL: z.string().min(1),
  HERMES_LOCALE: z.string().min(2).default("pt-BR"),
  HERMES_TIME_ZONE: z.string().min(1).default("America/Sao_Paulo"),
  PORT: z.coerce.number().int().positive().max(65_535).default(3000)
});

export interface HermesConfig {
  databaseUrl: string;
  telegramBotToken: string;
  allowedTelegramUserId: string;
  openAiApiKey: string;
  interpretationModel: string;
  locale: string;
  timeZone: string;
  port: number;
}

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): HermesConfig {
  const parsed = environmentSchema.parse(environment);
  return {
    databaseUrl: parsed.DATABASE_URL,
    telegramBotToken: parsed.TELEGRAM_BOT_TOKEN,
    allowedTelegramUserId: parsed.TELEGRAM_ALLOWED_USER_ID,
    openAiApiKey: parsed.OPENAI_API_KEY,
    interpretationModel: parsed.OPENAI_INTERPRETATION_MODEL,
    locale: parsed.HERMES_LOCALE,
    timeZone: parsed.HERMES_TIME_ZONE,
    port: parsed.PORT
  };
}
