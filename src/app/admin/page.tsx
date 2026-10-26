import { redirect } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { getCurrentUser } from "@/lib/server/auth";
import { query } from "@/lib/server/db";
import { AdminDashboard } from "./admin-dashboard";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "Admin") redirect("/dashboard");
  const listings = await query<{ id: string; category: string; price: string; status: string; seller_name: string }>("SELECT i.id, i.category, i.price, i.status, u.full_name AS seller_name FROM items i JOIN users u ON u.id = i.seller_id WHERE i.status IN ('Available', 'Removed') ORDER BY i.created_at DESC LIMIT 100");
  const queue = listings.rows.map((item) => ({ listingId: item.id, status: item.status === "Removed" ? "Flagged" as const : "Pending" as const, category: item.category, price: Number(item.price), seller: item.seller_name, title: `${item.category} listing` }));
  return (
    <>
      <SiteHeader />
      <AdminDashboard queue={queue} user={user} />
      <SiteFooter />
    </>
  );
}
