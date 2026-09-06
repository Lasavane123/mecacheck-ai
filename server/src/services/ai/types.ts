import { z } from "zod";

/**
 * Version du prompt utilisé pour générer un diagnostic.
 * À incrémenter à chaque changement du contenu/structure du prompt,
 * pour pouvoir tracer avec quelle version chaque diagnostic a été produit
 * (colonne diagnosis_results.prompt_version).
 */
export const PROMPT_VERSION = "mecacheck-diagnosis-v1";

// ============ Entrée : ce dont un fournisseur IA a besoin pour analyser ============

export interface DiagnosisPromptInput {
  vehicle: {
    brand: string;
    model: string;
    year: number;
    engine: string | null;
    fuel_type: string;
    transmission: string;
    mileage_km: number;
  };
  symptom_description: string;
  symptom_category: string | null;
  context: string | null;
  duration: string | null;
  is_worsening: boolean | null;
  questions_and_answers: Array<{ question: string; answer: string }>;
}

// ============ Sortie : format structuré, identique quel que soit le fournisseur ============

const causeSchema = z.object({
  name: z.string().min(1),
  probability: z.enum(["faible", "moyenne", "elevee"]),
  explanation: z.string().min(1),
});

export const diagnosisAiResponseSchema = z.object({
  summary: z.string().min(1),
  causes: z.array(causeSchema).min(1).max(6),
  urgency: z.enum(["faible", "a_surveiller", "important", "urgent"]),
  recommendations: z.array(z.string().min(1)).min(1).max(8),
  cost_estimate_min_fcfa: z.number().int().nonnegative().nullable(),
  cost_estimate_max_fcfa: z.number().int().nonnegative().nullable(),
  analysis_explanation: z.string().min(1),
  insufficient_information: z.boolean(),
});

export type DiagnosisAiResponse = z.infer<typeof diagnosisAiResponseSchema>;

// ============ Interface que chaque fournisseur doit implémenter ============

export interface AiProvider {
  /** Identifiant court du fournisseur, ex. "anthropic", "openai". Utilisé pour le logging. */
  readonly name: string;

  /**
   * Envoie le prompt de diagnostic au fournisseur et renvoie sa réponse BRUTE
   * (texte ou JSON non encore validé). La validation de forme et de sécurité
   * est faite ensuite, de façon identique pour tous les fournisseurs
   * (voir services/ai/index.ts).
   *
   * Doit lever :
   * - AiTimeoutError si le fournisseur ne répond pas dans le délai imparti
   * - AiProviderError pour toute autre erreur réseau / HTTP / fournisseur
   */
  generate(input: DiagnosisPromptInput, promptVersion: string): Promise<unknown>;
}
