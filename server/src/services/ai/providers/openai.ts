import { AiNotConfiguredError, AiProviderError, AiTimeoutError } from "../errors";
import { buildDiagnosisPrompt } from "../promptBuilder";
import type { AiProvider, DiagnosisPromptInput } from "../types";

const DEFAULT_TIMEOUT_MS = 20_000;

/**
 * Adaptateur pour l'API OpenAI. Même remarque que pour AnthropicProvider :
 * inactif tant que OPENAI_API_KEY n'est pas défini et AI_PROVIDER=openai
 * n'est pas explicitement choisi.
 */
export class OpenAiProvider implements AiProvider {
  readonly name = "openai";

  async generate(input: DiagnosisPromptInput, promptVersion: string): Promise<unknown> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new AiNotConfiguredError(
        "OPENAI_API_KEY absent. Ajoute la clé et définis AI_PROVIDER=openai pour activer ce fournisseur."
      );
    }

    const prompt = buildDiagnosisPrompt(input);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: `prompt_version: ${promptVersion}` },
            { role: "user", content: prompt },
          ],
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new AiProviderError(this.name, `HTTP ${res.status} — ${await res.text()}`);
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = data.choices?.[0]?.message?.content;
      if (!text) {
        throw new AiProviderError(this.name, "Réponse sans contenu texte exploitable.");
      }
      return JSON.parse(text);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new AiTimeoutError(this.name, DEFAULT_TIMEOUT_MS);
      }
      if (err instanceof AiProviderError) throw err;
      throw new AiProviderError(this.name, err instanceof Error ? err.message : String(err));
    } finally {
      clearTimeout(timeout);
    }
  }
}
