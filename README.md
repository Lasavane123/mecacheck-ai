# MecaCheck AI — V1.0

Assistant automobile mobile qui aide les automobilistes à comprendre un
problème sur leur véhicule via un **pré-diagnostic IA à titre indicatif**
(ne remplace pas un mécanicien qualifié).

## Ce qui a été construit (étapes 1–3 : initialisation, architecture, authentification)

- Structure du projet : `app/` (Expo Router), `components/`, `lib/`,
  `types/`, `constants/`, `hooks/` pour le mobile ; `server/` pour le
  backend sécurisé ; `supabase/migrations/` pour la base de données.
- `package.json` + `tsconfig.json` (mobile et serveur), `app.json` (Expo).
- Identité visuelle de base : palette sombre/premium (`constants/theme.ts`).
- Types partagés `Vehicle`, `Diagnosis`, `DiagnosisResult`, etc.
  (`types/database.ts`), alignés sur le schéma SQL.
- Client Supabase mobile (`lib/supabase.ts`) — clé publique uniquement.
- Client API mobile (`lib/api.ts`) — parle uniquement au backend, jamais
  directement au fournisseur IA.
- Composants réutilisables `components/TextField.tsx`,
  `components/PrimaryButton.tsx`.
- **Authentification réelle (Supabase Auth, aucune donnée simulée)** :
  - `lib/auth-context.tsx` : `AuthProvider`/`useAuth`, session chargée
    au démarrage puis tenue à jour via `onAuthStateChange`, méthodes
    `signUp`, `signIn`, `signOut`, `sendPasswordResetEmail`,
    `updatePassword` — toutes appellent réellement Supabase.
  - `lib/validation/auth.ts` : validation Zod des formulaires (email,
    règle de mot de passe, confirmation).
  - Écrans `app/(auth)/login.tsx`, `signup.tsx`, `forgot-password.tsx`,
    `reset-password.tsx` (ce dernier lit le lien reçu par email via
    `lib/parseRecoveryTokens.ts` et établit une vraie session de
    récupération avant de permettre le changement de mot de passe).
  - `app/_layout.tsx` : redirection automatique — utilisateur non
    connecté → `(auth)/login` ; utilisateur connecté qui arrive sur un
    écran `(auth)` → accueil. Basée sur la session Supabase réelle, pas
    sur un état simulé.
  - Écran d'accueil (`app/index.tsx`) affiche l'utilisateur connecté et
    propose une vraie déconnexion.
  - Messages d'erreur Supabase traduits en français compréhensible
    (section 32 du cahier des charges).
- Backend Express (`server/`) : sécurité de base (helmet, CORS, rate
  limiting, limite de taille des messages), middleware d'authentification
  Supabase, endpoints `/api/diagnosis/start`, `/questions`, `/analyze`
  (stub), `GET /api/diagnoses`, `GET/DELETE /api/diagnosis/:id`.
- Couche d'abstraction IA (`server/src/services/ai/`) : interface
  `AiProvider` commune, indépendante du fournisseur ; prompt versionné
  (`promptBuilder.ts`, `PROMPT_VERSION`) ; validation de format (Zod) et
  de sécurité (garde-fous section 29) identiques quel que soit le
  fournisseur ; erreurs typées (`AiNotConfiguredError`, `AiTimeoutError`,
  `AiProviderError`, `AiFormatValidationError`, `AiSafetyValidationError`) ;
  gestion de timeout (`AbortController`, 20s) ; deux adaptateurs de
  référence (`providers/anthropic.ts`, `providers/openai.ts`) — **aucun
  fournisseur n'est actif par défaut** (`AI_PROVIDER` vide) : le choix
  reste à valider, aucune API payante n'a été branchée. Ne simule jamais
  de réponse : sans configuration, le pipeline lève une erreur explicite.
- Migration SQL complète (`supabase/migrations/0001_init.sql`) : tables
  `vehicles`, `diagnoses`, `diagnosis_questions`, `diagnosis_results`,
  `favorites`, avec **Row Level Security** garantissant qu'un utilisateur
  ne peut accéder qu'à ses propres données.
- `.env.example` (aucune vraie clé) et `.gitignore`.

## Ce qui a été testé

Rien n'a encore été exécuté (pas d'installation `npm install`, pas de
lancement Expo, pas de base Supabase réelle connectée). C'est un
squelette de code prêt à être installé et testé, pas encore une
application qui tourne. Le code d'authentification est réel et
fonctionnel dès qu'un vrai projet Supabase est connecté (voir
`.env.example`), mais n'a pas encore été exécuté sur un simulateur.

## Ce qui fonctionne

La structure, la logique de validation (Zod), les garde-fous de sécurité
IA, les politiques RLS, et le flux d'authentification complet
(inscription, connexion, déconnexion, mot de passe oublié + réel lien de
récupération) sont écrits et cohérents avec le cahier des charges, mais
n'ont pas été validés en conditions réelles (nécessite un projet
Supabase configuré + `npm install` + lancement Expo).

## Ce qui reste à faire (étapes suivantes du plan en 17 étapes)

4. Connexion réelle à un projet Supabase + exécution de la migration
   (aujourd'hui `.env.example` n'a que des valeurs d'exemple)
5. Navigation complète (onglets bas de page : Accueil, Diagnostic,
   Véhicules, Historique, Profil)
6. Écrans "Ajouter/sélectionner un véhicule", "Décrire le problème",
   "Questions intelligentes", "Analyse en cours", "Résultat"
7. Gestion des véhicules (CRUD complet côté mobile)
8–9. Flux de diagnostic + questions adaptatives (logique métier)
10. Activation d'un fournisseur IA (`AI_PROVIDER`) — en attente de ta
    décision, voir comparatif fourni séparément
11. Écran résultat avec causes, urgence, coût, explication
12. Historique (filtres, recherche)
13–14. Profil (avec téléphone optionnel, stats de compte) et paramètres
15. Durcissement sécurité (restreindre CORS, tests RLS multi-comptes,
    tester que le lien de récupération expire correctement)
16. Tests (voir section 38 du cahier des charges)
17. Build Android/iOS

## Blocages actuels

Aucun blocage technique. Deux décisions produit en attente :
1. Quel fournisseur IA activer via `AI_PROVIDER` (comparatif déjà fourni)
2. Les identifiants d'un vrai projet Supabase (URL + clés) pour pouvoir
   réellement tester inscription/connexion/récupération de compte —
   sans ça, le code d'authentification est complet mais ne peut pas être
   exécuté de bout en bout.
