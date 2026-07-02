import React from "react";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/public/Reveal";

export const metadata = {
  title: "Privacy Policy — Significia",
  description:
    "How Significia handles data — and why most of your clients' data never touches our servers in the first place.",
};

const SECTIONS = [
  {
    title: "The short version",
    body: [
      "Significia is built around the Bridge model: your client data lives on your own database and your own storage, on infrastructure you control. We don't hold a copy of it, and in most cases we never see it at all.",
      "This policy explains what information we do collect (mainly about you and your firm, not your clients), how we use it, and the choices you have.",
    ],
  },
  {
    title: "What we don't collect",
    body: [
      "We do not store your clients' personal data, financial records, risk profiles, or documents on our servers. Under the Bridge model, that data is created, stored, and retrieved directly from your own database and cloud storage bucket.",
      "When a report or query is requested, Significia sends a structured question to your Bridge, your Bridge answers from inside your own infrastructure, and the response passes through our systems only in memory — it is never written to our storage.",
    ],
  },
  {
    title: "What we do collect",
    body: [
      "To operate your account and the platform, we collect information about you and your firm: your name, work email, phone number, firm name, role, and login credentials.",
      "We also collect basic usage data — pages visited, features used, timestamps, and device/browser information — to keep the platform reliable and improve it over time.",
      "If you contact us through the site (for a demo, pricing, or support), we collect what you submit in that form: your name, firm, email, phone number, and message.",
    ],
  },
  {
    title: "How we use this information",
    body: [
      "To create and manage your account, authenticate you, and provide the platform.",
      "To respond to demo requests, pricing enquiries, and support questions.",
      "To monitor platform health, diagnose issues, and improve performance.",
      "To send you important account or service notices. We do not sell your data or use it for third-party advertising.",
    ],
  },
  {
    title: "Cookies and analytics",
    body: [
      "We use essential cookies to keep you signed in and remember basic preferences. We may use privacy-respecting analytics to understand how the public site is used, so we can improve it — this does not include your clients' data, which never reaches our servers.",
    ],
  },
  {
    title: "Data retention",
    body: [
      "We retain your account and firm information for as long as your account is active, and for a reasonable period afterward to meet legal and operational requirements. You can request deletion of your account information at any time — see Your Rights below.",
      "Because client data lives on your own infrastructure, retention and deletion of that data is entirely under your control, independent of your relationship with Significia.",
    ],
  },
  {
    title: "Security",
    body: [
      "Your database credentials are held locally by the Bridge on your own server and are never transmitted to or stored by Significia. Communication between your Bridge and our backend is encrypted in transit.",
      "You control a kill switch that can instantly cut off Significia's access to your Bridge at any time.",
    ],
  },
  {
    title: "Your rights",
    body: [
      "You can request access to, correction of, or deletion of the account and firm information we hold about you by contacting us. Because we don't hold your clients' data, requests concerning client information should be handled directly within your own systems.",
    ],
  },
  {
    title: "Changes to this policy",
    body: [
      "We may update this policy from time to time. If we make material changes, we'll notify registered users by email or through the platform.",
    ],
  },
  {
    title: "Contact us",
    body: [
      "Questions about this policy or how we handle data? Reach us at hello@significia.com.",
    ],
  },
];

const SECTION_DELAYS = [0, 75, 100, 150, 200, 300] as const;

export default function PrivacyPage() {
  return (
    <div className="py-20 px-4">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Reveal>
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary mb-4">
              Privacy Policy
            </Badge>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Your privacy, by architecture
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Last updated {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </Reveal>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {SECTIONS.map((section, i) => (
            <Reveal key={section.title} delay={SECTION_DELAYS[i % SECTION_DELAYS.length]}>
              <div className="p-6 rounded-xl border border-border/50 bg-card/30">
                <h2 className="text-lg font-bold mb-3">{section.title}</h2>
                <div className="space-y-3">
                  {section.body.map((paragraph, j) => (
                    <p key={j} className="text-sm text-muted-foreground leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
