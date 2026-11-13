import { SettingsScreen } from "@/features/settings/SettingsScreen";
import "@/pwa/pwaInstall";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function SettingsPage() {
  useDocumentTitle("Settings");
  return <SettingsScreen />;
}
