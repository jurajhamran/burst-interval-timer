import { SettingsScreen } from "@/features/settings/SettingsScreen";
import "@/pwa/pwaInstall";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export function SettingsPage() {
  useDocumentTitle("Settings");
  return <SettingsScreen />;
}