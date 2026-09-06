import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors, spacing, radius } from "@/constants/theme";
import { useAuth } from "@/lib/auth-context";

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  // TODO (étape suivante) : remplacer par l'état réel du véhicule sélectionné
  // et le dernier diagnostic, une fois la base de données véhicules branchée.
  const hasVehicle = false;

  async function handleSignOut() {
    await signOut();
    // La redirection vers /(auth)/login est gérée automatiquement par
    // RootLayoutNav dès que la session devient nulle.
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MECA CHECK AI</Text>
      <Text style={styles.subtitle}>Votre assistant automobile intelligent</Text>

      {user ? (
        <Text style={styles.userLine}>
          Connecté en tant que {(user.user_metadata?.full_name as string | undefined) ?? user.email}
        </Text>
      ) : null}

      <Text style={styles.vehicleLine}>
        {hasVehicle ? "🚗 Votre véhicule sélectionné" : "Ajoutez votre véhicule pour commencer"}
      </Text>

      <Pressable
        style={styles.cta}
        onPress={() => router.push("/diagnosis")}
        accessibilityRole="button"
      >
        <Text style={styles.ctaText}>🔧 NOUVEAU DIAGNOSTIC</Text>
      </Pressable>
      <Text style={styles.ctaHelper}>Un problème avec votre voiture ? Décrivons-le ensemble.</Text>

      <Pressable style={styles.signOut} onPress={handleSignOut} accessibilityRole="button">
        <Text style={styles.signOutText}>🚪 Déconnexion</Text>
      </Pressable>
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
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
  },
  vehicleLine: {
    color: colors.text,
    fontSize: 15,
    marginTop: spacing.md,
  },
  userLine: {
    color: colors.textMuted,
    fontSize: 13,
  },
  cta: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  ctaText: {
    color: colors.background,
    fontWeight: "700",
    fontSize: 16,
  },
  ctaHelper: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
  },
  signOut: {
    marginTop: spacing.xl,
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  signOutText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
