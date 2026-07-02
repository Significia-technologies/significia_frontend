import React from "react";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/public/Reveal";

export const metadata = {
  title: "Terms of Service — Significia",
  description:
    "The terms that govern your use of the Significia platform for Investment Advisors.",
};

const SECTIONS = [
  {
    title: "Acceptance of terms",
    body: [
      "By creating an account or using Significia, you agree to these Terms of Service on behalf of yourself and, if applicable, the firm you represent. If you don't agree, please don't use the platform.",
    ],
  },
  {
    title: "What Significia provides",
    body: [
      "Significia is a white-labeled client portal and practice-management platform for Investment Advisors, built on the Bridge model: your database and file storage run on your own infrastructure, and the Significia Bridge connects our platform to it without transmitting your credentials to us.",
      "We provide the software, the portal experience, and the compliance and workflow tooling. You remain responsible for the accuracy of the advice, data, and documents you produce using the platform.",
    ],
  },
  {
    title: "Accounts and eligibility",
    body: [
      "You must provide accurate information when creating an account and keep your login credentials confidential. You're responsible for all activity that happens under your account, including actions taken by staff you've invited.",
      "You must be authorized to act on behalf of your firm to accept these terms and to onboard clients onto the platform.",
    ],
  },
  {
    title: "Your responsibilities",
    body: [
      "You are solely responsible for provisioning, securing, and maintaining your own database and storage infrastructure, and for the accuracy and compliance of the advice, records, and reports you generate.",
      "You are responsible for obtaining any consents required from your clients to process their data on your own infrastructure, and for complying with applicable regulations that govern your advisory practice.",
    ],
  },
  {
    title: "Acceptable use",
    body: [
      "You agree not to misuse the platform — including attempting to bypass the Bridge's query allowlist, reverse-engineering the software, reselling access without authorization, or using the platform to store or transmit unlawful content.",
      "We may suspend or terminate accounts that violate these terms or that we reasonably believe pose a security or legal risk to the platform or other users.",
    ],
  },
  {
    title: "Data and the Bridge model",
    body: [
      "Client data lives on your own database and storage, under your control. Significia does not hold a persistent copy of your client data. Our Privacy Policy describes in detail what information we do collect and how we use it.",
      "You can disable the Bridge's access to your infrastructure at any time using the kill switch, which immediately cuts off Significia's ability to query your database.",
    ],
  },
  {
    title: "Fees and payment",
    body: [
      "Pricing is tailored to your firm and agreed separately at onboarding. Fees are billed as agreed in your order form or contract, and are non-refundable except where required by law or explicitly agreed in writing.",
      "We may change pricing for future billing periods with reasonable notice.",
    ],
  },
  {
    title: "Intellectual property",
    body: [
      "Significia and its licensors retain all rights to the platform's software, design, and branding. Subject to these terms, we grant you a limited, non-exclusive, non-transferable license to use the platform for your advisory practice.",
      "You retain all rights to your own data, content, and branding used within your white-labeled portal.",
    ],
  },
  {
    title: "White-label license",
    body: [
      "You may apply your own logo, colors, firm name, and domain to your portal. This white-label license is granted for as long as your account remains active and in good standing, and does not transfer ownership of the underlying platform to you.",
    ],
  },
  {
    title: "Termination",
    body: [
      "You may stop using the platform and close your account at any time. We may suspend or terminate your account for breach of these terms, non-payment, or security concerns, with notice where practicable.",
      "Because your data lives on your own infrastructure, termination does not affect your ability to access or export it independently of Significia.",
    ],
  },
  {
    title: "Disclaimers and limitation of liability",
    body: [
      "The platform is provided \"as is\" without warranties of any kind, express or implied. Significia is not responsible for the accuracy of advisory content you produce, or for issues arising from your own infrastructure, database, or storage configuration.",
      "To the fullest extent permitted by law, Significia's liability for any claim relating to the platform is limited to the fees you paid us in the twelve months preceding the claim.",
    ],
  },
  {
    title: "Governing law",
    body: [
      "These terms are governed by the laws of India, without regard to conflict-of-law principles. Any disputes will be subject to the exclusive jurisdiction of the courts located in India.",
    ],
  },
  {
    title: "Changes to these terms",
    body: [
      "We may update these terms from time to time. If we make material changes, we'll notify registered users by email or through the platform before the changes take effect.",
    ],
  },
  {
    title: "Contact us",
    body: [
      "Questions about these terms? Reach us at hello@significia.com.",
    ],
  },
];

const SECTION_DELAYS = [0, 75, 100, 150, 200, 300] as const;

export default function TermsPage() {
  return (
    <div className="py-20 px-4">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Reveal>
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary mb-4">
              Terms of Service
            </Badge>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              The rules of the road
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
