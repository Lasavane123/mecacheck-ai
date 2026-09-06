import { useRouter } from "expo-router";
import { VehicleForm } from "@/components/VehicleForm";
import { createVehicle, type VehicleInput } from "@/lib/services/vehicleService";

export default function NewVehicleScreen() {
  const router = useRouter();

  async function handleSubmit(input: VehicleInput) {
    await createVehicle(input);
    router.back();
  }

  return <VehicleForm submitLabel="Enregistrer le véhicule" onSubmit={handleSubmit} />;
}
