"use client";

import { use } from "react";
import ClientRegistrationForm from "@/features/master/ClientRegistration";

/**
 * Edit Client Page — Bridge Architecture
 * No connector lookup needed. The Bridge handles DB access server-side.
 */
export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ClientRegistrationForm clientId={id} />;
}
