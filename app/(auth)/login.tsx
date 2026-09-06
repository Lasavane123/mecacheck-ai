import { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Link, useRouter } from "expo-router";
import { colors, spacing } from "@/constants/theme";
import { TextField } from "@/components/TextField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAuth } from "@/lib/auth-context";
import { loginSchema, fieldErrors } from "@/lib/validation/auth";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setFormError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    const { error } = await signIn(parsed.data.email, parsed.data.password);
    setIsSubmitting(false);
    if (error) {
      setFormError(error);
      return;
    }
    router.replace("/");
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>MECA CHECK AI</Text>
        <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          error={errors.email}
          testID="login-email"
        />
        <TextField
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={errors.password}
          testID="login-password"
        />

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        <PrimaryButton label="Se connecter" onPress={handleSubmit} loading={isSubmitting} />

        <Link href="/(auth)/forgot-password" style={styles.link}>
          Mot de passe oublié ?
        </Link>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Pas encore de compte ?</Text>
          <Link href="/(auth)/signup" style={styles.linkStrong}>
            Créer un compte
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 26,
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
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  linkStrong: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700",
  },
});
