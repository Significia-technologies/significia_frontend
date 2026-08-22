import React from "react";
import { MaintenanceMode } from "@/components/public/MaintenanceMode";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MaintenanceMode />;
}
