import { Pressable, Text, View, StyleSheet } from "react-native";
import { colors, spacing, radius } from "@/constants/theme";
import type { Vehicle } from "@/types/database";
import { fuelTypeOptions, transmissionOptions } from "@/lib/validation/vehicle";

const fuelLabels = Object.fromEntries(fuelTypeOptions.map((o) => [o.value, o.label]));
const transmissionLabels = Object.fromEntries(transmissionOptions.map((o) => [o.value, o.label]));

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress: () => void;
}

export function VehicleCard({ vehicle, onPress }: VehicleCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
      <Text style={styles.title}>
        {vehicle.brand} {vehicle.model}
      </Text>
      <Text style={styles.subtitle}>
        {vehicle.year} • {fuelLabels[vehicle.fuel_type] ?? vehicle.fuel_type} •{" "}
        {transmissionLabels[vehicle.transmission] ?? vehicle.transmission}
      </Text>
      <View style={styles.footerRow}>
        <Text style={styles.meta}>{vehicle.mileage_km.toLocaleString("fr-FR")} km</Text>
        {vehicle.license_plate ? (
          <Text style={styles.meta}>{vehicle.license_plate}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
  },
  footerRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
