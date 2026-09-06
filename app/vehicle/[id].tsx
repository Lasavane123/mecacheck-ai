import { useCallback, useState } from "react";
import { View, Text, ActivityIndicator, Pressable, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { colors, spacing } from "@/constants/theme";
import { VehicleForm, type VehicleFormValues } from "@/components/VehicleForm";
import { getVehicle, updateVehicle, deleteVehicle, type VehicleInput } from "@/lib/services/vehicleService";
import type { Vehicle } from "@/types/database";

function toFormValues(vehicle: Vehicle): VehicleFormValues {
  return {
    brand: vehicle.brand,
    model: vehicle.model,
    year: String(vehicle.year),
    engine: vehicle.engine ?? "",
    fuelType: vehicle.fuel_type,
    transmission: vehicle.transmission,
    mileageKm: String(vehicle.mileage_km),
    licensePlate: vehicle.license_plate ?? "",
  };
}

export default function EditVehicleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      getVehicle(id)
        .then((data) => {
          if (isMounted) setVehicle(data);
        })
        .catch((err) => {
          if (isMounted) setError(err instanceof Error ? err.message : "Une erreur est survenue.");
        });
      return () => {
        isMounted = false;
      };
    }, [id])
  );

  async function handleSubmit(input: VehicleInput) {
    await updateVehicle(id, input);
    router.back();
  }

  function confirmDelete() {
    Alert.alert(
      "Supprimer ce véhicule ?",
      "Cette action est définitive. Les diagnostics déjà liés à ce véhicule resteront dans votre historique.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteVehicle(id);
              router.back();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Une erreur est survenue.");
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <VehicleForm
        initialValues={toFormValues(vehicle)}
        submitLabel="Enregistrer les modifications"
        onSubmit={handleSubmit}
      />
      <Pressable
        style={styles.deleteButton}
        onPress={confirmDelete}
        disabled={isDeleting}
        accessibilityRole="button"
      >
        <Text style={styles.deleteText}>{isDeleting ? "Suppression…" : "🗑️ Supprimer ce véhicule"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  error: {
    color: colors.urgencyCritical,
    fontSize: 14,
    textAlign: "center",
  },
  deleteButton: {
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
  },
  deleteText: {
    color: colors.urgencyCritical,
    fontSize: 14,
    fontWeight: "600",
  },
});
