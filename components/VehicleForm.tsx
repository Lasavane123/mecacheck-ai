import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { colors, spacing } from "@/constants/theme";
import { TextField } from "@/components/TextField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ChipSelect } from "@/components/ChipSelect";
import {
  vehicleFormSchema,
  fieldErrors,
  fuelTypeOptions,
  transmissionOptions,
} from "@/lib/validation/vehicle";
import type { VehicleInput } from "@/lib/services/vehicleService";
import type { FuelType, TransmissionType } from "@/types/database";

export interface VehicleFormValues {
  brand: string;
  model: string;
  year: string;
  engine: string;
  fuelType: FuelType | null;
  transmission: TransmissionType | null;
  mileageKm: string;
  licensePlate: string;
}

const emptyValues: VehicleFormValues = {
  brand: "",
  model: "",
  year: "",
  engine: "",
  fuelType: null,
  transmission: null,
  mileageKm: "",
  licensePlate: "",
};

interface VehicleFormProps {
  initialValues?: VehicleFormValues;
  submitLabel: string;
  onSubmit: (input: VehicleInput) => Promise<void>;
}

export function VehicleForm({ initialValues, submitLabel, onSubmit }: VehicleFormProps) {
  const [values, setValues] = useState<VehicleFormValues>(initialValues ?? emptyValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update<K extends keyof VehicleFormValues>(key: K, value: VehicleFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit() {
    setFormError(null);

    const parsed = vehicleFormSchema.safeParse({
      brand: values.brand,
      model: values.model,
      year: values.year,
      engine: values.engine,
      fuelType: values.fuelType ?? undefined,
      transmission: values.transmission ?? undefined,
      mileageKm: values.mileageKm,
      licensePlate: values.licensePlate,
    });

    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      await onSubmit({
        brand: parsed.data.brand,
        model: parsed.data.model,
        year: Number(parsed.data.year),
        engine: parsed.data.engine,
        fuel_type: parsed.data.fuelType,
        transmission: parsed.data.transmission,
        mileage_km: Number(parsed.data.mileageKm),
        license_plate: parsed.data.licensePlate ? parsed.data.licensePlate : null,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TextField
          label="Marque"
          value={values.brand}
          onChangeText={(v) => update("brand", v)}
          placeholder="Ex. Toyota"
          autoCapitalize="words"
          error={errors.brand}
        />
        <TextField
          label="Modèle"
          value={values.model}
          onChangeText={(v) => update("model", v)}
          placeholder="Ex. Corolla"
          autoCapitalize="words"
          error={errors.model}
        />
        <TextField
          label="Année"
          value={values.year}
          onChangeText={(v) => update("year", v)}
          placeholder="Ex. 2019"
          keyboardType="number-pad"
          maxLength={4}
          error={errors.year}
        />
        <TextField
          label="Motorisation"
          value={values.engine}
          onChangeText={(v) => update("engine", v)}
          placeholder="Ex. 1.6 Essence"
          error={errors.engine}
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Carburant</Text>
          <ChipSelect
            options={fuelTypeOptions}
            value={values.fuelType}
            onChange={(v) => update("fuelType", v)}
          />
          {errors.fuelType ? <Text style={styles.error}>{errors.fuelType}</Text> : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Boîte de vitesses</Text>
          <ChipSelect
            options={transmissionOptions}
            value={values.transmission}
            onChange={(v) => update("transmission", v)}
          />
          {errors.transmission ? <Text style={styles.error}>{errors.transmission}</Text> : null}
        </View>

        <TextField
          label="Kilométrage"
          value={values.mileageKm}
          onChangeText={(v) => update("mileageKm", v)}
          placeholder="Ex. 92000"
          keyboardType="number-pad"
          error={errors.mileageKm}
        />
        <TextField
          label="Immatriculation (facultatif)"
          value={values.licensePlate}
          onChangeText={(v) => update("licensePlate", v)}
          placeholder="Ex. DK-1234-AB"
          autoCapitalize="characters"
          error={errors.licensePlate}
        />

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        <PrimaryButton label={submitLabel} onPress={handleSubmit} loading={isSubmitting} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
  },
  error: {
    color: colors.urgencyCritical,
    fontSize: 12,
  },
  formError: {
    color: colors.urgencyCritical,
    fontSize: 13,
    textAlign: "center",
  },
});
