import { supabase } from "@/lib/supabase";
import type { Vehicle, FuelType, TransmissionType } from "@/types/database";

export interface VehicleInput {
  brand: string;
  model: string;
  year: number;
  engine: string;
  fuel_type: FuelType;
  transmission: TransmissionType;
  mileage_km: number;
  license_plate: string | null;
}

/**
 * Toutes les fonctions ci-dessous appellent directement Supabase depuis le
 * mobile (clé publique "anon" uniquement — voir lib/supabase.ts). C'est
 * sûr et suffisant ici : la table `vehicles` a RLS activé (voir
 * supabase/migrations/0001_init.sql), donc Postgres garantit lui-même
 * qu'un utilisateur ne peut lire/modifier que ses propres véhicules. Le
 * backend Express (server/) reste réservé à ce qui a besoin de secrets
 * (l'IA) — il n'y a pas lieu de dupliquer cette logique CRUD là-bas.
 */

export async function listVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error("Impossible de charger vos véhicules.");
  return data as Vehicle[];
}

export async function getVehicle(id: string): Promise<Vehicle | null> {
  const { data, error } = await supabase.from("vehicles").select("*").eq("id", id).maybeSingle();

  if (error) throw new Error("Impossible de charger ce véhicule.");
  return data as Vehicle | null;
}

export async function createVehicle(input: VehicleInput): Promise<Vehicle> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Utilisateur non authentifié.");

  const { data, error } = await supabase
    .from("vehicles")
    .insert({ ...input, user_id: user.id })
    .select()
    .single();

  if (error) throw new Error("Impossible d'enregistrer le véhicule.");
  return data as Vehicle;
}

export async function updateVehicle(id: string, input: VehicleInput): Promise<Vehicle> {
  const { data, error } = await supabase
    .from("vehicles")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error("Impossible de modifier le véhicule.");
  return data as Vehicle;
}

export async function deleteVehicle(id: string): Promise<void> {
  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) throw new Error("Impossible de supprimer le véhicule.");
}
