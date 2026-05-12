import Link from "next/link";
import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const PORTFOLIO_MODULES = [
  {
    label: "Investor Master",
    description: "Manage client investors, family members and HUF with sub-code generation.",
    href: "/portfolio/investor-master",
    icon: Users,
  },
];

export default function PortfolioPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Portfolio</h1>
        <p className="text-sm text-muted-foreground">Select a module to get started.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PORTFOLIO_MODULES.map((mod) => (
          <Link key={mod.href} href={mod.href}>
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardContent className="p-5 flex gap-4 items-start">
                <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
                  <mod.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{mod.label}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{mod.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
