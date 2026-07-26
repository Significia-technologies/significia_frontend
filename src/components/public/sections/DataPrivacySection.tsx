import React from "react";
import { Home, KeyRound, Eye, Power } from "lucide-react";

const PRIVACY_POINTS = [
  {
    icon: Home,
    title: "Your database lives in your house",
    description:
      "We help you set it up. You own it. It runs on your server or your own cloud account. Significia has no access to it directly — ever.",
  },
  {
    icon: KeyRound,
    title: "Your password never leaves your server",
    description:
      "The Bridge (Patent Applied) holds your database credentials locally. They are never transmitted to Significia. If our servers were hacked tomorrow, attackers would find no client data — because none was ever stored here.",
  },
  {
    icon: Eye,
    title: "We see answers, not raw data",
    description:
      "We send structured questions to the Bridge (Patent Applied) (\"get risk profile for client X\"). The Bridge (Patent Applied) fetches the answer and returns only that. We never browse your database. We never see passwords or credentials.",
  },
  {
    icon: Power,
    title: "You have a kill switch",
    description:
      "Stop the Bridge (Patent Applied) at any time — instantly cutting all of Significia's access to your data. Uninstall it and we are completely locked out. You own the database. Export, migrate, or delete independently.",
  },
];

export function DataPrivacySection() {
  return (
    <section className="py-24 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Text */}
          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
              Data Privacy
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              "Your data lives in your house."
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              This isn't just marketing. It's the technical architecture. Every IA gets their own
              database, their own storage, and their own Bridge (Patent Applied) — all on their own infrastructure.
              No shared database. No cross-IA data. No exceptions.
            </p>
            <blockquote className="border-l-2 border-primary/40 pl-4 text-sm text-muted-foreground italic">
              "We send questions to your Bridge (Patent Applied). Your Bridge (Patent Applied) answers from inside your house.
              We never have a copy of your key."
            </blockquote>
          </div>

          {/* Right: Points */}
          <div className="space-y-6">
            {PRIVACY_POINTS.map((point) => {
              const Icon = point.icon;
              return (
                <div key={point.title} className="flex gap-4">
                  <div className="shrink-0 mt-0.5 h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-1">{point.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {point.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
