import { useCallback, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { colors, spacing } from "@/constants/theme";
import { PrimaryButton } from "@/components/PrimaryButton";
import { VehicleCard } from "@/components/VehicleCard";
import { listVehicles } from "@/lib/services/vehicleService";
import type { Vehicle } from "@/types/database";

export default function VehicleListScreen() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await listVehicles();
      setVehicles(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  }, []);

  // Recharge à chaque retour sur l'écran (après ajout/modification/suppression).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (vehicles === null && !error) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={vehicles ?? []}
        keyExtractor={(v) => v.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Vous n'avez encore aucun véhicule enregistré.</Text>
            <Text style={styles.emptySubtitle}>
              Ajoutez votre véhicule pour pouvoir lancer des diagnostics personnalisés.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <VehicleCard vehicle={item} onPress={() => router.push(`/vehicle/${item.id}`)} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />

      <View style={styles.footer}>
        <PrimaryButton label="➕ Ajouter un véhicule" onPress={() => router.push("/vehicle/new")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
  },
  error: {
    color: colors.urgencyCritical,
    fontSize: 13,
    textAlign: "center",
  },
  footer: {
    paddingTop: spacing.sm,
  },
});
