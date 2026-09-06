import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { colors, spacing } from "@/constants/theme";
import { TextField } from "@/components/TextField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { resetPasswordSchema, fieldErrors } from "@/lib/validation/auth";
import { parseRecoveryTokensFromUrl } from "@/lib/parseRecoveryTokens";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { updatePassword } = useAuth();
  const url = Linking.useURL();

  const [isSessionReady, setIsSessionReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function establishRecoverySession() {
      const tokens = parseRecoveryTokensFromUrl(url ?? (await Linking.getInitialURL()));
      if (!tokens) {
        setLinkError(
          "Ce lien de réinitialisation est invalide ou a expiré. Merci de refaire une demande."
        );
        return;
      }
      const { error } = await supabase.auth.setSession({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });
      if (error) {
        setLinkError("Ce lien de réinitialisation est invalide ou a expiré.");
        return;
      }
      setIsSessionReady(true);
    }
    establishRecoverySession();
  }, [url]);

  async function handleSubmit() {
    setFormError(null);
    const parsed = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    const { error } = await updatePassword(parsed.data.password);
    setIsSubmitting(false);
    if (error) {
      setFormError(error);
      return;
    }
    setSuccess(true);
  }

  if (linkError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Lien invalide</Text>
        <Text style={styles.subtitle}>{linkError}</Text>
        <PrimaryButton
          label="Refaire une demande"
          onPress={() => router.replace("/(auth)/forgot-password")}
        />
      </View>
    );
  }

  if (success) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Mot de passe mis à jour ✅</Text>
        <Text style={styles.subtitle}>Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</Text>
        <PrimaryButton label="Se connecter" onPress={() => router.replace("/(auth)/login")} />
      </View>
    );
  }

  if (!isSessionReady) {
    return (
      <View style={styles.container}>
        <Text style={styles.subtitle}>Vérification du lien…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nouveau mot de passe</Text>
      <TextField
        label="Nouveau mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        error={errors.password}
      />
      <TextField
        label="Confirmer le mot de passe"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        error={errors.confirmPassword}
      />
      {formError ? <Text style={styles.formError}>{formError}</Text> : null}
      <PrimaryButton label="Valider" onPress={handleSubmit} loading={isSubmitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: "center",
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  formError: {
    color: colors.urgencyCritical,
    fontSize: 13,
    textAlign: "center",
  },
});
