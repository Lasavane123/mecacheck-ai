// Types partagés entre l'app mobile et le backend.
// Reflètent exactement le schéma PostgreSQL (voir /supabase/migrations).

export type FuelType = "essence" | "diesel" | "hybride" | "electrique" | "gpl" | "autre";
export type TransmissionType = "manuelle" | "automatique" | "robotisee" | "cvt";

export interface Vehicle {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  year: number;
  engine: string | null;
  fuel_type: FuelType;
  transmission: TransmissionType;
  mileage_km: number;
  vin: string | null;
  license_plate: string | null;
  last_service_date: string | null;
  last_oil_change_date: string | null;
  mileage_at_last_service_km: number | null;
  modifications: string | null;
  notes: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export type UrgencyLevel = "faible" | "a_surveiller" | "important" | "urgent";

export interface DiagnosisQuestion {
  id: string;
  diagnosis_id: string;
  order_index: number;
  question_text: string;
  answer_value: string | null;
  answer_type: "yes_no_unknown" | "scale" | "frequency" | "multiple_choice" | "free_text";
  created_at: string;
}

export interface DiagnosisCause {
  name: string;
  probability: "faible" | "moyenne" | "elevee";
  explanation: string;
}

export interface DiagnosisResult {
  id: string;
  diagnosis_id: string;
  summary: string;
  causes: DiagnosisCause[];
  urgency: UrgencyLevel;
  recommendations: string[];
  cost_estimate_min_fcfa: number | null;
  cost_estimate_max_fcfa: number | null;
  cost_estimate_note: string | null;
  analysis_explanation: string | null;
  ai_provider: string;
  prompt_version: string;
  created_at: string;
}

export type DiagnosisStatus = "in_progress" | "completed" | "failed" | "safety_stop";

export interface Diagnosis {
  id: string;
  user_id: string;
  vehicle_id: string;
  symptom_description: string;
  symptom_category: string | null;
  context: string | null;
  duration: string | null;
  is_worsening: boolean | null;
  status: DiagnosisStatus;
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  diagnosis_id: string;
  created_at: string;
}
