import { SettingsScreen } from "@/features/settings/SettingsScreen";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export function SettingsPage() {
  useDocumentTitle("Settings");
  return <SettingsScreen />;
}