// Client HTTP vers le backend MecaCheck AI.
// L'app mobile ne parle jamais directement au fournisseur IA :
// elle passe toujours par ce backend, qui détient les clés secrètes.

import { supabase } from "./supabase";

// Volontairement lu à l'intérieur d'une fonction (pas au chargement du
// module) : si on lisait/validait EXPO_PUBLIC_API_BASE_URL au niveau du
// module, le simple fait d'importer ce fichier ferait planter toute l'app
// tant que la variable n'est pas définie — y compris des écrans qui
// n'appellent jamais l'API. On préfère échouer proprement, uniquement au
// moment d'un appel réel.
function getApiBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!url) {
    throw new ApiNotConfiguredError(
      "EXPO_PUBLIC_API_BASE_URL n'est pas défini (voir .env.example) : le backend n'est pas encore configuré."
    );
  }
  return url;
}

/** Le backend n'est pas encore configuré/déployé — distinct d'une vraie erreur réseau ou HTTP. */
export class ApiNotConfiguredError extends Error {}

async function authHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Utilisateur non authentifié.");
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function apiPost<TResponse, TBody = unknown>(
  path: string,
  body: TBody
): Promise<TResponse> {
  const apiBaseUrl = getApiBaseUrl();
  const headers = await authHeader();
  const res = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Erreur API (${res.status}) sur ${path}`);
  }
  return res.json() as Promise<TResponse>;
}

export async function apiGet<TResponse>(path: string): Promise<TResponse> {
  const apiBaseUrl = getApiBaseUrl();
  const headers = await authHeader();
  const res = await fetch(`${apiBaseUrl}${path}`, { headers });
  if (!res.ok) {
    throw new Error(`Erreur API (${res.status}) sur ${path}`);
  }
  return res.json() as Promise<TResponse>;
}
