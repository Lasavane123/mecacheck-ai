import { Stack } from "expo-router";
import { colors } from "@/constants/theme";

export default function VehicleLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "600" },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Mes véhicules" }} />
      <Stack.Screen name="new" options={{ title: "Ajouter un véhicule" }} />
      <Stack.Screen name="[id]" options={{ title: "Modifier le véhicule" }} />
    </Stack>
  );
}
