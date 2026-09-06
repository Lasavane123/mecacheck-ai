import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Link, useRouter } from "expo-router";
import { colors, spacing } from "@/constants/theme";
import { TextField } from "@/components/TextField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAuth } from "@/lib/auth-context";
import { forgotPasswordSchema, fieldErrors } from "@/lib/validation/auth";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { sendPasswordResetEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setFormError(null);
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    const { error } = await sendPasswordResetEmail(parsed.data.email);
    setIsSubmitting(false);
    if (error) {
      setFormError(error);
      return;
    }
    setEmailSent(true);
  }

  if (emailSent) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Email envoyé ✅</Text>
        <Text style={styles.subtitle}>
          Si un compte existe avec l'adresse {email}, un lien de réinitialisation vient d'être
          envoyé. Ouvrez-le depuis votre téléphone pour définir un nouveau mot de passe.
        </Text>
        <PrimaryButton label="Retour à la connexion" onPress={() => router.replace("/(auth)/login")} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mot de passe oublié</Text>
      <Text style={styles.subtitle}>
        Indiquez votre email : nous vous envoyons un lien pour le réinitialiser.
      </Text>

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        error={errors.email}
      />

      {formError ? <Text style={styles.formError}>{formError}</Text> : null}

      <PrimaryButton label="Envoyer le lien" onPress={handleSubmit} loading={isSubmitting} />

      <Link href="/(auth)/login" style={styles.link}>
        Retour à la connexion
      </Link>
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
  link: {
    color: colors.accent,
    fontSize: 13,
    textAlign: "center",
    marginTop: spacing.md,
  },
});
