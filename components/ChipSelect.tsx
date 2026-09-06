import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, spacing, radius } from "@/constants/theme";

export interface ChipOption<T extends string> {
  value: T;
  label: string;
}

interface ChipSelectProps<T extends string> {
  options: ReadonlyArray<ChipOption<T>>;
  value: T | null;
  onChange: (value: T) => void;
}

/** Rangée de choix uniques sous forme de "chips" — utilisé par le diagnostic et le formulaire véhicule. */
export function ChipSelect<T extends string>({ options, value, onChange }: ChipSelectProps<T>) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.chip, isSelected && styles.chipSelected]}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipSelected: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  chipTextSelected: {
    color: colors.text,
    fontWeight: "600",
  },
});
