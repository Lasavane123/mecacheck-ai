-- MecaCheck AI — schéma initial
-- users est géré par Supabase Auth (auth.users) ; on référence auth.uid() partout.

create extension if not exists "pgcrypto";

-- ============ VEHICLES ============
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand text not null,
  model text not null,
  year int not null check (year between 1950 and 2100),
  engine text,
  fuel_type text not null check (fuel_type in ('essence','diesel','hybride','electrique','gpl','autre')),
  transmission text not null check (transmission in ('manuelle','automatique','robotisee','cvt')),
  mileage_km int not null default 0 check (mileage_km >= 0),
  vin text,
  last_service_date date,
  last_oil_change_date date,
  mileage_at_last_service_km int,
  modifications text,
  notes text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vehicles_user_id_idx on public.vehicles(user_id);

-- ============ DIAGNOSES ============
create table if not exists public.diagnoses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  symptom_description text not null check (char_length(symptom_description) <= 2000),
  symptom_category text,
  context text,
  duration text,
  is_worsening boolean,
  status text not null default 'in_progress'
    check (status in ('in_progress','completed','failed','safety_stop')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists diagnoses_user_id_idx on public.diagnoses(user_id);
create index if not exists diagnoses_vehicle_id_idx on public.diagnoses(vehicle_id);

-- ============ DIAGNOSIS QUESTIONS (questions adaptatives + réponses) ============
create table if not exists public.diagnosis_questions (
  id uuid primary key default gen_random_uuid(),
  diagnosis_id uuid not null references public.diagnoses(id) on delete cascade,
  order_index int not null,
  question_text text not null,
  answer_value text,
  answer_type text not null
    check (answer_type in ('yes_no_unknown','scale','frequency','multiple_choice','free_text')),
  created_at timestamptz not null default now()
);

create index if not exists diagnosis_questions_diagnosis_id_idx
  on public.diagnosis_questions(diagnosis_id);

-- ============ DIAGNOSIS RESULTS ============
create table if not exists public.diagnosis_results (
  id uuid primary key default gen_random_uuid(),
  diagnosis_id uuid not null unique references public.diagnoses(id) on delete cascade,
  summary text not null,
  causes jsonb not null default '[]'::jsonb,       -- [{name, probability, explanation}]
  urgency text not null check (urgency in ('faible','a_surveiller','important','urgent')),
  recommendations jsonb not null default '[]'::jsonb, -- string[]
  cost_estimate_min_fcfa int,
  cost_estimate_max_fcfa int,
  cost_estimate_note text,
  analysis_explanation text,
  ai_provider text not null,        -- ex. "anthropic", "openai" — traçabilité (section: abstraction IA)
  prompt_version text not null,     -- ex. "mecacheck-diagnosis-v1" — traçabilité
  created_at timestamptz not null default now()
);

-- ============ FAVORITES ============
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  diagnosis_id uuid not null references public.diagnoses(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, diagnosis_id)
);

-- ============ ROW LEVEL SECURITY ============
-- Chaque utilisateur ne voit / modifie que ses propres données (section 26).

alter table public.vehicles enable row level security;
alter table public.diagnoses enable row level security;
alter table public.diagnosis_questions enable row level security;
alter table public.diagnosis_results enable row level security;
alter table public.favorites enable row level security;

create policy "vehicles_owner_all" on public.vehicles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "diagnoses_owner_all" on public.diagnoses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "diagnosis_questions_owner_all" on public.diagnosis_questions
  for all using (
    exists (
      select 1 from public.diagnoses d
      where d.id = diagnosis_questions.diagnosis_id and d.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.diagnoses d
      where d.id = diagnosis_questions.diagnosis_id and d.user_id = auth.uid()
    )
  );

create policy "diagnosis_results_owner_all" on public.diagnosis_results
  for all using (
    exists (
      select 1 from public.diagnoses d
      where d.id = diagnosis_results.diagnosis_id and d.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.diagnoses d
      where d.id = diagnosis_results.diagnosis_id and d.user_id = auth.uid()
    )
  );

create policy "favorites_owner_all" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
