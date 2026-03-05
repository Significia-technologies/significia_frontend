import { DashboardLayout } from "@/components/layouts/DashboardLayout";

export const metadata = {
  title: "Dashboard — RRFinance",
};

export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
