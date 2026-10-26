import { redirect } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { mockModerationQueue } from "@/lib/mock-data";
import { getCurrentUser } from "@/lib/server/auth";
import { AdminDashboard } from "./admin-dashboard";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "Admin") redirect("/dashboard");
  return (
    <>
      <SiteHeader />
      <AdminDashboard queue={mockModerationQueue} user={user} />
      <SiteFooter />
    </>
  );
}
