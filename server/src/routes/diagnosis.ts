import { Router } from "express";
import { z } from "zod";
import { requireAuth, supabaseAdmin, type AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// ============ POST /api/diagnosis/start ============
// Crée un diagnostic en cours à partir de la description libre du symptôme.

const startSchema = z.object({
  vehicle_id: z.string().uuid(),
  symptom_description: z.string().min(3).max(2000), // limite de taille (section 33)
  symptom_category: z.string().max(50).optional(),
  context: z.string().max(50).optional(),
  duration: z.string().max(50).optional(),
  is_worsening: z.boolean().optional(),
});

router.post("/start", async (req: AuthedRequest, res) => {
  const parsed = startSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Données insuffisantes ou invalides." });
  }

  const { data: vehicle } = await supabaseAdmin
    .from("vehicles")
    .select("id")
    .eq("id", parsed.data.vehicle_id)
    .eq("user_id", req.userId)
    .maybeSingle();

  if (!vehicle) {
    return res.status(404).json({ error: "Véhicule introuvable." });
  }

  const { data, error } = await supabaseAdmin
    .from("diagnoses")
    .insert({ ...parsed.data, user_id: req.userId, status: "in_progress" })
    .select()
    .single();

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Impossible de démarrer le diagnostic." });
  }

  return res.status(201).json(data);
});

// ============ POST /api/diagnosis/questions ============
// Enregistre la réponse à une question adaptative.
// La logique de génération de la question suivante sera ajoutée à l'étape "Questions intelligentes".

const answerSchema = z.object({
  diagnosis_id: z.string().uuid(),
  order_index: z.number().int().nonnegative(),
  question_text: z.string().min(1).max(300),
  answer_value: z.string().max(300),
  answer_type: z.enum(["yes_no_unknown", "scale", "frequency", "multiple_choice", "free_text"]),
});

router.post("/questions", async (req: AuthedRequest, res) => {
  const parsed = answerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Réponse invalide." });
  }

  const { data: diagnosis } = await supabaseAdmin
    .from("diagnoses")
    .select("id")
    .eq("id", parsed.data.diagnosis_id)
    .eq("user_id", req.userId)
    .maybeSingle();

  if (!diagnosis) {
    return res.status(404).json({ error: "Diagnostic introuvable." });
  }

  const { data, error } = await supabaseAdmin
    .from("diagnosis_questions")
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Impossible d'enregistrer la réponse." });
  }

  return res.status(201).json(data);
});

// ============ POST /api/diagnosis/analyze ============
// Déclenche l'analyse IA. Implémentation complète à l'étape "Backend IA" (voir services/ai/index.ts).

router.post("/analyze", async (req: AuthedRequest, res) => {
  const schema = z.object({ diagnosis_id: z.string().uuid() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "diagnosis_id manquant ou invalide." });
  }

  // TODO étape "Backend IA" — reste à faire (le fournisseur IA n'étant pas
  // encore choisi/activé par le produit, cet endpoint reste un stub) :
  // 1. charger le diagnostic + véhicule + réponses (DiagnosisPromptInput)
  // 2. appeler runDiagnosisAnalysis(input) depuis services/ai
  // 3. sur succès : écrire le résultat + prompt_version + provider dans
  //    diagnosis_results, passer diagnoses.status à "completed"
  // 4. sur AiNotConfiguredError / AiTimeoutError / AiProviderError /
  //    AiFormatValidationError / AiSafetyValidationError : renvoyer un
  //    message utilisateur propre (section 32), jamais l'erreur brute
  return res.status(501).json({
    error:
      "L'analyse IA n'est pas encore activée : aucun fournisseur IA n'a été choisi/configuré.",
  });
});

// ============ GET /api/diagnoses ============

router.get("/", async (req: AuthedRequest, res) => {
  const { data, error } = await supabaseAdmin
    .from("diagnoses")
    .select("*, diagnosis_results(*)")
    .eq("user_id", req.userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Impossible de charger l'historique." });
  }
  return res.json(data);
});

// ============ GET /api/diagnosis/:id ============

router.get("/:id", async (req: AuthedRequest, res) => {
  const { data, error } = await supabaseAdmin
    .from("diagnoses")
    .select("*, diagnosis_questions(*), diagnosis_results(*)")
    .eq("id", req.params.id)
    .eq("user_id", req.userId)
    .maybeSingle();

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Impossible de charger le diagnostic." });
  }
  if (!data) {
    return res.status(404).json({ error: "Diagnostic introuvable." });
  }
  return res.json(data);
});

// ============ DELETE /api/diagnosis/:id ============

router.delete("/:id", async (req: AuthedRequest, res) => {
  const { error } = await supabaseAdmin
    .from("diagnoses")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.userId);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Suppression impossible." });
  }
  return res.status(204).send();
});

export default router;
