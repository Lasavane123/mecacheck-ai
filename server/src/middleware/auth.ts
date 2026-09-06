import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

// Client admin (clé service_role) — utilisé UNIQUEMENT côté serveur, jamais exposé au mobile.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
);

export interface AuthedRequest extends Request {
  userId?: string;
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentification requise." });
  }
  const token = authHeader.slice("Bearer ".length);

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: "Session invalide ou expirée." });
  }

  req.userId = data.user.id;
  next();
}

export { supabaseAdmin };
