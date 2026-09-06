import { Pressable, Text, ActivityIndicator, StyleSheet, type GestureResponderEvent } from "react-native";
import { colors, spacing, radius } from "@/constants/theme";

interface PrimaryButtonProps {
  label: string;
  onPress: (e: GestureResponderEvent) => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
}: PrimaryButtonProps) {
  const isSecondary = variant === "secondary";
  return (
    <Pressable
      style={[
        styles.button,
        isSecondary ? styles.secondary : styles.primary,
        (disabled || loading) && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary ? colors.text : colors.background} />
      ) : (
        <Text style={isSecondary ? styles.secondaryText : styles.primaryText}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.6,
  },
  primaryText: {
    color: colors.background,
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryText: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 15,
  },
});
