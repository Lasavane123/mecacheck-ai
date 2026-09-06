import { AiNotConfiguredError, AiProviderError, AiTimeoutError } from "../errors";
import { buildDiagnosisPrompt } from "../promptBuilder";
import type { AiProvider, DiagnosisPromptInput } from "../types";

const DEFAULT_TIMEOUT_MS = 20_000;

/**
 * Adaptateur pour l'API Anthropic (Claude).
 * Purement structurel pour l'instant : n'effectue un appel réel que si
 * ANTHROPIC_API_KEY est défini ET que le fournisseur a été explicitement
 * activé côté produit (AI_PROVIDER=anthropic). Tant que ce n'est pas le
 * cas, generate() lève AiNotConfiguredError plutôt que de renvoyer une
 * réponse simulée.
 */
export class AnthropicProvider implements AiProvider {
  readonly name = "anthropic";

  async generate(input: DiagnosisPromptInput, promptVersion: string): Promise<unknown> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new AiNotConfiguredError(
        "ANTHROPIC_API_KEY absent. Ajoute la clé et définis AI_PROVIDER=anthropic pour activer ce fournisseur."
      );
    }

    const prompt = buildDiagnosisPrompt(input);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system: `[prompt_version: ${promptVersion}]`,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new AiProviderError(this.name, `HTTP ${res.status} — ${await res.text()}`);
      }

      const data = (await res.json()) as { content?: Array<{ text?: string }> };
      const text = data.content?.[0]?.text;
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
