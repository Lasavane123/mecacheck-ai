import { AiNotConfiguredError, AiFormatValidationError, AiSafetyValidationError } from "./errors";
import { PROMPT_VERSION } from "./promptBuilder";
import {
  diagnosisAiResponseSchema,
  type AiProvider,
  type DiagnosisAiResponse,
  type DiagnosisPromptInput,
} from "./types";
import { AnthropicProvider } from "./providers/anthropic";
import { OpenAiProvider } from "./providers/openai";

export type { DiagnosisAiResponse, DiagnosisPromptInput, AiProvider };
export { PROMPT_VERSION } from "./promptBuilder";
export * from "./errors";

/**
 * Sélectionne le fournisseur IA actif via la variable d'environnement
 * AI_PROVIDER. AUCUN fournisseur n'est actif par défaut : c'est un choix
 * produit explicite, pas une valeur par défaut codée en dur, pour éviter
 * de brancher une API payante sans décision volontaire.
 */
function getAiProvider(): AiProvider {
  const selected = process.env.AI_PROVIDER;

  switch (selected) {
    case "anthropic":
      return new AnthropicProvider();
    case "openai":
      return new OpenAiProvider();
    // Ajouter ici un nouveau "case" suffit à brancher un fournisseur
    // supplémentaire (Mistral, Gemini, etc.) sans toucher au reste du
    // pipeline — c'est tout l'intérêt de l'interface AiProvider.
    default:
      throw new AiNotConfiguredError(
        `Aucun fournisseur IA actif (AI_PROVIDER="${selected ?? "non défini"}"). ` +
          `Valeurs possibles : "anthropic", "openai". Choix produit à faire explicitement.`
      );
  }
}

// Formulations interdites (section 29 : garde-fous contre la fausse certitude)
const FORBIDDEN_PATTERNS = [
  /définitivement (cassé|hors service|défectueux)/i,
  /vous pouvez continuer à rouler sans problème/i,
  /cette réparation est forcément nécessaire/i,
  /c'est certainement/i,
  /à 100 ?%/,
];

function validateAiSafety(response: DiagnosisAiResponse): void {
  const text = [
    response.summary,
    response.analysis_explanation,
    ...response.recommendations,
    ...response.causes.map((c) => c.explanation),
  ].join(" ");

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) {
      throw new AiSafetyValidationError(
        "La réponse contient une formulation de certitude injustifiée."
      );
    }
  }
}

export interface DiagnosisAnalysisResult extends DiagnosisAiResponse {
  /** Fournisseur qui a produit cette réponse (traçabilité). */
  provider: string;
  /** Version du prompt utilisée (traçabilité — voir promptBuilder.ts). */
  prompt_version: string;
}

/**
 * Pipeline complet, identique quel que soit le fournisseur choisi :
 * appel du fournisseur → validation de format (Zod) → validation de
 * sécurité (garde-fous) → résultat structuré + traçable.
 *
 * Ne renvoie JAMAIS une réponse simulée : si aucun fournisseur n'est
 * configuré, ou si le fournisseur échoue, une erreur explicite est levée
 * (AiNotConfiguredError, AiTimeoutError, AiProviderError,
 * AiFormatValidationError, AiSafetyValidationError) — jamais de données
 * inventées côté serveur.
 */
export async function runDiagnosisAnalysis(
  input: DiagnosisPromptInput
): Promise<DiagnosisAnalysisResult> {
  const provider = getAiProvider();

  const raw = await provider.generate(input, PROMPT_VERSION);

  const parsed = diagnosisAiResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AiFormatValidationError(parsed.error.message);
  }

  validateAiSafety(parsed.data);

  return {
    ...parsed.data,
    provider: provider.name,
    prompt_version: PROMPT_VERSION,
  };
}
