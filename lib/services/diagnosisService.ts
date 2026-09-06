import { apiPost, ApiNotConfiguredError } from "@/lib/api";

export interface DiagnosisRequestInput {
  /** null tant que la fonctionnalité "véhicule" n'existe pas côté produit. */
  vehicleId: string | null;
  symptomDescription: string;
  symptomCategory: string | null;
}

export type DiagnosisOutcome =
  | { status: "unavailable"; reason: string }
  | { status: "started"; diagnosisId: string };

/**
 * Point d'intégration unique avec l'API existante
 * (server/src/routes/diagnosis.ts — POST /api/diagnosis/start).
 *
 * Deux prérequis produit manquent encore aujourd'hui :
 * - aucune fonctionnalité "véhicule" n'existe (vehicleId est toujours null) ;
 * - aucun fournisseur IA n'est activé côté serveur (AI_PROVIDER vide), donc
 *   même une fois le diagnostic démarré, /api/diagnosis/analyze répond 501.
 *
 * Tant que ce n'est pas réglé, on ne tente pas un appel voué à échouer et on
 * renvoie explicitement "unavailable" — jamais un diagnostic inventé.
 * Une fois le véhicule et le fournisseur IA branchés, cette fonction est le
 * seul endroit à faire évoluer : l'écran n'a pas à changer.
 */
export async function requestDiagnosis(
  input: DiagnosisRequestInput
): Promise<DiagnosisOutcome> {
  if (!input.vehicleId) {
    return {
      status: "unavailable",
      reason:
        "Aucun véhicule n'est encore enregistré. L'analyse complète nécessite un véhicule associé au diagnostic — cette fonctionnalité arrive bientôt.",
    };
  }

  try {
    const diagnosis = await apiPost<{ id: string }>("/api/diagnosis/start", {
      vehicle_id: input.vehicleId,
      symptom_description: input.symptomDescription,
      symptom_category: input.symptomCategory ?? undefined,
    });
    return { status: "started", diagnosisId: diagnosis.id };
  } catch (err) {
    if (err instanceof ApiNotConfiguredError) {
      return {
        status: "unavailable",
        reason: "Le service d'analyse n'est pas encore configuré.",
      };
    }
    // Erreur réseau / HTTP (section 32 du cahier des charges : message utilisateur propre).
    return {
      status: "unavailable",
      reason: "Le service d'analyse est temporairement indisponible. Merci de réessayer plus tard.",
    };
  }
}
