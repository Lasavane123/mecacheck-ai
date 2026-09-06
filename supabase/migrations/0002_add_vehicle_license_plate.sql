-- Ajout de l'immatriculation (facultative), distincte du VIN déjà présent.
-- Migration additive : ne touche pas à 0001_init.sql, potentiellement déjà exécutée.

alter table public.vehicles
  add column if not exists license_plate text;
