import React from "react";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/public/Reveal";

export const metadata = {
  title: "Regulatory Disclosure — Significia",
  description:
    "Significia's role as a technology provider, and how that relates to your own regulatory responsibilities as an Investment Advisor.",
};

const SECTIONS = [
  {
    title: "Purpose of this disclosure",
    body: [
      "This page explains what Significia is — and, just as importantly, what it isn't — so that Investment Advisors, their staff, and their clients understand the nature of the platform and where regulatory responsibility sits.",
    ],
  },
  {
    title: "Significia is a technology provider",
    body: [
      "Significia is a software platform that provides a white-labeled client portal and practice-management tooling for Investment Advisors. We are not registered as an Investment Adviser, broker, or any other regulated financial intermediary, and we do not provide investment advice, recommendations, or research to any advisor's clients.",
      "Any advice, recommendation, risk profile, or financial plan generated through the platform is produced and issued by the Investment Advisor using the platform — not by Significia.",
    ],
  },
  {
    title: "Your regulatory responsibility",
    body: [
      "As an Investment Advisor using Significia, you remain solely responsible for your own registration status, licensing, record-keeping obligations, and compliance with applicable regulations governing investment advisory activity in your jurisdiction.",
      "Significia does not review, approve, or take responsibility for the advisory content, risk assessments, or reports you produce using the platform. The platform provides the tools; the professional judgment and regulatory accountability remain yours.",
    ],
  },
  {
    title: "Data hosting and architecture",
    body: [
      "Significia is built on the Bridge model: each advisor provisions their own database and file storage on infrastructure they control. Significia does not host, store, or retain a persistent copy of client data on its own servers — it sends structured queries to your Bridge, and your Bridge answers from inside your own environment.",
      "This architecture is designed to support advisors who need to demonstrate independent control over where and how client data is hosted, as part of meeting their own regulatory obligations. It does not by itself constitute regulatory advice or a guarantee of compliance — that determination rests with you and your own compliance function.",
    ],
  },
  {
    title: "No investment advice from Significia",
    body: [
      "Nothing on this platform, this website, or in any communication from Significia should be construed as investment advice, a recommendation to buy or sell any security, or an offer of advisory services from Significia itself.",
    ],
  },
  {
    title: "Grievances and regulatory queries",
    body: [
      "If you have a question about how the platform's architecture relates to your compliance obligations, or a grievance regarding the platform itself, please contact us at hello@significia.com and we will respond within a reasonable time.",
      "Grievances regarding the advisory services, advice, or conduct of an individual Investment Advisor should be directed to that advisor directly, and escalated through the appropriate regulatory channel for your jurisdiction.",
    ],
  },
  {
    title: "Changes to this disclosure",
    body: [
      "We may update this disclosure from time to time to reflect changes to the platform or our understanding of applicable requirements. Material changes will be communicated to registered users.",
    ],
  },
];

const SECTION_DELAYS = [0, 75, 100, 150, 200, 300] as const;

export default function DisclosurePage() {
  return (
    <div className="py-20 px-4">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Reveal>
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary mb-4">
              Regulatory Disclosure
            </Badge>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Where Significia's role ends
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
