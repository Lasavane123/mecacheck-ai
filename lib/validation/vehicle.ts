import { z } from "zod";

export { fieldErrors } from "./shared";

const currentYear = new Date().getFullYear();

export const fuelTypeOptions = [
  { value: "essence", label: "Essence" },
  { value: "diesel", label: "Diesel" },
  { value: "hybride", label: "Hybride" },
  { value: "electrique", label: "Électrique" },
  { value: "gpl", label: "GPL" },
  { value: "autre", label: "Autre" },
] as const;

export const transmissionOptions = [
  { value: "manuelle", label: "Manuelle" },
  { value: "automatique", label: "Automatique" },
  { value: "robotisee", label: "Robotisée" },
  { value: "cvt", label: "CVT" },
] as const;

export const vehicleFormSchema = z.object({
  brand: z.string().trim().min(1, "Marque requise").max(60),
  model: z.string().trim().min(1, "Modèle requis").max(60),
  year: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Année invalide")
    .refine((v) => Number(v) >= 1950 && Number(v) <= currentYear + 1, "Année invalide"),
  engine: z.string().trim().min(1, "Motorisation requise").max(60),
  fuelType: z.enum(["essence", "diesel", "hybride", "electrique", "gpl", "autre"], {
    message: "Carburant requis",
  }),
  transmission: z.enum(["manuelle", "automatique", "robotisee", "cvt"], {
    message: "Boîte de vitesses requise",
  }),
  mileageKm: z
    .string()
    .trim()
    .regex(/^\d+$/, "Kilométrage invalide (nombre entier positif)"),
  licensePlate: z.string().trim().max(20).optional().or(z.literal("")),
});

export type VehicleFormInput = z.infer<typeof vehicleFormSchema>;
