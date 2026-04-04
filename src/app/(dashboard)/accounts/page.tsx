import ClientDirectory from "@/features/accounts/ClientDirectory";

export const metadata = {
  title: "Client Directory | Significia",
  description: "View and manage your assigned investor clients in the private Bridge database.",
};

export default function AccountsPage() {
  return <ClientDirectory />;
}
