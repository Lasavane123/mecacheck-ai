/**
 * Le lien envoyé par Supabase pour la réinitialisation de mot de passe
 * transporte access_token / refresh_token soit en query string, soit
 * après un "#" (fragment), selon la configuration. On gère les deux cas
 * sans dépendre d'un format précis.
 */
export function parseRecoveryTokensFromUrl(
  url: string | null
): { accessToken: string; refreshToken: string } | null {
  if (!url) return null;

  const fragmentIndex = url.indexOf("#");
  const queryIndex = url.indexOf("?");
  const paramsString =
    fragmentIndex !== -1
      ? url.slice(fragmentIndex + 1)
      : queryIndex !== -1
        ? url.slice(queryIndex + 1)
        : "";

  if (!paramsString) return null;

  const params = new URLSearchParams(paramsString);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}
