import React from "react";
import MemberOnboardingForm from "@/features/team/MemberOnboardingForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Onboard Team Member | Significia",
  description: "Register and configure a new professional account.",
};

export default function OnboardPage() {
  return (
    <div className="container py-8">
      <MemberOnboardingForm />
    </div>
  );
}
