import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { mockModerationQueue } from "@/lib/mock-data";
import { AdminDashboard } from "./admin-dashboard";

export default function AdminPage() {
  return (
    <>
      <SiteHeader />
      <AdminDashboard queue={mockModerationQueue} />
      <SiteFooter />
    </>
  );
}
