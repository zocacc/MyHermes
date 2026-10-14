import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import type { InterpretationInput, Interpreter } from "../../application/ports.js";
import type { ItemDraft } from "../../domain/model.js";

const interpretedItemSchema = z.object({
  type: z.enum(["note", "task", "reminder"]),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(20_000),
  dueAt: z.iso.datetime().nullable()
});

export class OpenAiInterpreter implements Interpreter {
  private readonly client: OpenAI;

  constructor(
    apiKey: string,
    private readonly model: string
  ) {
    this.client = new OpenAI({ apiKey });
  }

  async interpret(input: InterpretationInput): Promise<ItemDraft> {
    const response = await this.client.responses.parse({
      model: this.model,
      input: [
        {
          role: "system",
          content: [
            "Classifique a entrada pessoal como note, task ou reminder.",
            "Extraia um título curto e preserve no corpo os detalhes relevantes.",
            "Use dueAt apenas quando houver data e hora suficientemente determinadas.",
            `Idioma: ${input.locale}. Fuso: ${input.timeZone}.`,
            `Instante de recebimento: ${input.receivedAt}.`
          ].join("\n")
        },
        { role: "user", content: input.text }
      ],
      text: {
        format: zodTextFormat(interpretedItemSchema, "hermes_item")
      }
    });

    if (!response.output_parsed) {
      throw new Error("OpenAI returned no structured Item");
    }

    return response.output_parsed;
  }
}
