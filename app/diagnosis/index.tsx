import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { colors, spacing, radius } from "@/constants/theme";
import { TextField } from "@/components/TextField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ChipSelect } from "@/components/ChipSelect";
import { requestDiagnosis, type DiagnosisOutcome } from "@/lib/services/diagnosisService";
import { listVehicles } from "@/lib/services/vehicleService";
import type { Vehicle } from "@/types/database";

// Catégories rapides — reprennent le vocabulaire du cahier des charges (écran "Décrire le problème").
const QUICK_CATEGORIES = [
  { value: "voyant", label: "🚨 Voyant allumé" },
  { value: "demarrage", label: "🔑 Démarrage" },
  { value: "bruit", label: "🔊 Bruit" },
  { value: "fumee", label: "💨 Fumée" },
  { value: "surchauffe", label: "🌡️ Surchauffe" },
  { value: "vibrations", label: "🚗 Vibrations" },
  { value: "puissance", label: "⚡ Perte de puissance" },
  { value: "freinage", label: "🛑 Freinage" },
  { value: "direction", label: "🛞 Direction" },
  { value: "fuite", label: "💧 Fuite" },
  { value: "climatisation", label: "❄️ Climatisation" },
  { value: "batterie", label: "🔋 Batterie / électricité" },
] as const;

export default function DiagnosisScreen() {
  const router = useRouter();

  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [outcome, setOutcome] = useState<DiagnosisOutcome | null>(null);

  // Recharge la liste à chaque retour sur l'écran (ex. après avoir ajouté un véhicule).
  useFocusEffect(
    useCallback(() => {
      listVehicles()
        .then((data) => {
          setVehicles(data);
          // Si le véhicule sélectionné a été supprimé entre-temps, on réinitialise.
          setSelectedVehicleId((current) =>
            current && data.some((v) => v.id === current) ? current : (data[0]?.id ?? null)
          );
        })
        .catch(() => setVehicles([]));
    }, [])
  );

  const hasVehicles = (vehicles?.length ?? 0) > 0;
  // Tant que des véhicules existent, l'analyse complète en a besoin : on
  // n'active le bouton que si un véhicule est réellement sélectionné.
  const canSubmit =
    description.trim().length > 0 && !isAnalyzing && (!hasVehicles || !!selectedVehicleId);

  async function handleAnalyze() {
    if (!canSubmit) return;
    setIsAnalyzing(true);
    setOutcome(null);

    const result = await requestDiagnosis({
      vehicleId: selectedVehicleId,
      symptomDescription: description.trim(),
      symptomCategory: selectedCategory,
    });

    setOutcome(result);
    setIsAnalyzing(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Diagnostic automobile</Text>
        <Text style={styles.subtitle}>
          Décrivez le problème de votre véhicule et MecaCheck AI vous aidera à l'analyser.
        </Text>

        {vehicles === null ? (
          <View style={styles.vehicleNotice}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : hasVehicles ? (
          <View style={styles.fieldGroup}>
            <Text style={styles.sectionLabel}>Véhicule à diagnostiquer</Text>
            <ChipSelect
              options={vehicles.map((v) => ({
                value: v.id,
                label: `🚗 ${v.brand} ${v.model} (${v.year})`,
              }))}
              value={selectedVehicleId}
              onChange={setSelectedVehicleId}
            />
          </View>
        ) : (
          <View style={styles.vehicleNotice}>
            <Text style={styles.vehicleNoticeText}>
              Aucun véhicule enregistré. Ajoutez-en un pour associer ce diagnostic à un véhicule
              précis — vous pouvez tout de même décrire le problème ci-dessous.
            </Text>
            <PrimaryButton
              label="➕ Ajouter un véhicule"
              variant="secondary"
              onPress={() => router.push("/vehicle/new")}
            />
          </View>
        )}

        <TextField
          label="Décrivez le problème de votre voiture..."
          value={description}
          onChangeText={setDescription}
          placeholder="Ex. : Ma voiture tremble quand j'accélère."
          multiline
          numberOfLines={6}
          autoCapitalize="sentences"
          autoCorrect
          textAlignVertical="top"
          style={styles.textArea}
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.sectionLabel}>Informations utiles (facultatif)</Text>
          <ChipSelect options={QUICK_CATEGORIES} value={selectedCategory} onChange={setSelectedCategory} />
        </View>

        <PrimaryButton
          label="🧠 Analyser le problème"
          onPress={handleAnalyze}
          disabled={!canSubmit}
          loading={isAnalyzing}
        />

        {outcome?.status === "unavailable" ? (
          <View style={styles.outcomeCard}>
            <Text style={styles.outcomeTitle}>⚠️ Analyse indisponible pour le moment</Text>
            <Text style={styles.outcomeText}>{outcome.reason}</Text>
          </View>
        ) : null}

        {outcome?.status === "started" ? (
          <View style={styles.outcomeCard}>
            <Text style={styles.outcomeTitle}>✅ Diagnostic enregistré</Text>
            <Text style={styles.outcomeText}>
              Votre description a été prise en compte. Le résultat détaillé s'affichera ici dès
              que l'analyse IA sera activée.
            </Text>
          </View>
        ) : null}

        <Text style={styles.disclaimer}>
          ⚠️ MecaCheck AI fournit un pré-diagnostic à titre indicatif. Il ne remplace pas
          l'inspection d'un mécanicien qualifié. En cas de problème pouvant affecter la sécurité
          du véhicule, cessez de conduire et contactez un professionnel.
        </Text>
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
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
  },
  vehicleNotice: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  vehicleNoticeText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  textArea: {
    minHeight: 140,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  outcomeCard: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  outcomeTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15,
  },
  outcomeText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  disclaimer: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.md,
  },
});
