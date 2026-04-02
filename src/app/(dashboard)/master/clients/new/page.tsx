"use client";

import ClientRegistrationForm from "@/features/master/ClientRegistration";

/**
 * New Client Page — Bridge Architecture
 * No connector lookup needed. The Bridge handles DB access server-side.
 */
export default function NewClientPage() {
  return <ClientRegistrationForm />;
}
