import { DeveloperSettings } from "@/features/master/DeveloperSettings/DeveloperSettings";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer Settings | Significia Master",
  description: "Manage API Keys and developer settings for your Sovereign Data Engine.",
};

export default function DeveloperSettingsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <DeveloperSettings />
    </div>
  );
}
