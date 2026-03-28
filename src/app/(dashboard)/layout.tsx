import { DashboardLayout } from "@/components/layouts/DashboardLayout";

export const metadata = {
  title: "Dashboard — Significia",
};

export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
