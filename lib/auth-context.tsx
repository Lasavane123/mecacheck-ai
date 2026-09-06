import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthResult {
  error: string | null;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** true tant que la session initiale n'a pas été chargée depuis le stockage sécurisé. */
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  sendPasswordResetEmail: (email: string) => Promise<AuthResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Traduit les messages d'erreur techniques Supabase en messages utilisateur clairs (section 32).
function toUserMessage(rawMessage: string): string {
  const message = rawMessage.toLowerCase();
  if (message.includes("invalid login credentials")) {
    return "Email ou mot de passe incorrect.";
  }
  if (message.includes("user already registered") || message.includes("already registered")) {
    return "Un compte existe déjà avec cet email.";
  }
  if (message.includes("email not confirmed")) {
    return "Merci de confirmer votre email avant de vous connecter.";
  }
  if (message.includes("network") || message.includes("fetch")) {
    return "Une connexion Internet est nécessaire pour continuer.";
  }
  return "Une erreur est survenue. Merci de réessayer.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function signUp(email: string, password: string, fullName: string): Promise<AuthResult> {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: "mecacheckai://auth/callback",
      },
    });

    if (error) return { error: toUserMessage(error.message) };
    return { error: null };
  }

  async function signIn(email: string, password: string): Promise<AuthResult> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: toUserMessage(error.message) };
    return { error: null };
  }

  async function signOut(): Promise<AuthResult> {
    const { error } = await supabase.auth.signOut();
    if (error) return { error: toUserMessage(error.message) };
    return { error: null };
  }

  async function sendPasswordResetEmail(email: string): Promise<AuthResult> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "mecacheckai://reset-password",
    });
    if (error) return { error: toUserMessage(error.message) };
    return { error: null };
  }

  async function updatePassword(newPassword: string): Promise<AuthResult> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: toUserMessage(error.message) };
    return { error: null };
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isLoading,
        signUp,
        signIn,
        signOut,
        sendPasswordResetEmail,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé à l'intérieur de <AuthProvider>.");
  return ctx;
}
