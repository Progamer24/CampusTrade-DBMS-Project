import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { ListingActions } from "@/components/listing-actions";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { StatusBadge } from "@/components/status-badge";
import { getCurrentUser } from "@/lib/server/auth";
import { query } from "@/lib/server/db";
import { mongoDb, postgresId } from "@/lib/server/mongodb";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
    const listingRows = await query<{ id: string; category: string; price: string; status: string; created_at: Date }>("SELECT id, category, price, status, created_at FROM items WHERE seller_id = $1 ORDER BY created_at DESC", [user.id]);
    const listingMetadata = await (await mongoDb()).collection("listings").find({ postgresItemId: { $in: listingRows.rows.map((row) => postgresId(row.id)) } }).toArray();
    const metadataById = new Map(listingMetadata.map((item) => [item.postgresItemId.toString(), item]));
    const myListings = listingRows.rows.map((row) => { const metadata = metadataById.get(row.id); return { id: Number(row.id), title: String(metadata?.title || `${row.category} listing`), category: row.category, price: Number(row.price), status: row.status, color: row.category === "Books" ? "lavender" : row.category === "Electronics" ? "blue" : "peach", emoji: row.category === "Books" ? "📚" : row.category === "Electronics" ? "🎧" : "🎒" }; });
    const studentOrders = await query<{ order_id: string; status: string; total_amount: string; created_at: Date }>("SELECT order_id, status, total_amount, created_at FROM order_summary WHERE buyer_id = $1 ORDER BY created_at DESC", [user.id]);
  const activeListings = myListings.filter(
    (listing) => listing.status === "Available"
  ).length;
    const pendingItems = studentOrders.rows.filter((order) => order.status === "Pending").length;
    const completedItems = studentOrders.rows.filter((order) => order.status === "Completed").length;

  return (
    <>
      <SiteHeader />
      <main className="page-container dashboard-page">
        <div className="page-intro">
          <div>
            <span className="eyebrow">STUDENT DASHBOARD · {user.role.toUpperCase()}</span>
            <h1>Good to see you, {user.fullName.split(" ")[0]}.</h1>
            <p>Keep track of your campus listings and recent activity.</p>
          </div>
          <div className="header-actions"><Link className="button button-dark" href="/sell">＋ Create a listing</Link><LogoutButton /></div>
        </div>

        <div className="preview-note" role="note">Signed in as {user.email}. Listing and order data will connect in the next phase.</div>

        <section className="profile-card" aria-labelledby="profile-heading">
          <div className="profile-avatar" aria-hidden="true">
            AS
          </div>
          <div>
            <span className="eyebrow">AUTHENTICATED PROFILE</span>
            <h2 id="profile-heading">{user.fullName}</h2>
            <p>{user.email}</p>
            <span className="field-hint">
              Role: {user.role === "Admin" ? "Campus Admin" : "Student"}
            </span>
          </div>
          <LogoutButton />
        </section>

        <section className="summary-grid" aria-label="Demo account summary">
          <article className="summary-card">
            <span className="summary-icon">↗</span>
            <span className="summary-label">ACTIVE LISTINGS</span>
            <strong>{activeListings}</strong>
            <small>Listings in your account</small>
          </article>
          <article className="summary-card">
            <span className="summary-icon">◷</span>
            <span className="summary-label">PENDING REQUESTS</span>
            <strong>{pendingItems}</strong>
            <small>Orders awaiting completion</small>
          </article>
          <article className="summary-card">
            <span className="summary-icon">✓</span>
            <span className="summary-label">COMPLETED TRANSACTIONS</span>
            <strong>{completedItems}</strong>
            <small>Completed purchases</small>
          </article>
        </section>

        <section className="dashboard-section" aria-labelledby="my-listings">
          <div className="section-heading dashboard-section-heading">
            <div>
              <span className="eyebrow">YOUR CAMPUS FINDS</span>
              <h2 id="my-listings">My listings</h2>
            </div>
            <Link href="/sell" className="text-link">
              Create a listing ↗
            </Link>
          </div>

          {myListings.length > 0 ? (
            <div className="dashboard-list">
              {myListings.map((listing) => (
                <article className="dashboard-listing" key={listing.id}>
                  <div className={`dashboard-item-icon ${listing.color}`}>
                    <span aria-hidden="true">{listing.emoji}</span>
                  </div>
                  <div className="dashboard-item-copy">
                    <span className="product-category">{listing.category}</span>
                    <h3>
                      <Link href={`/listings/${listing.id}`}>{listing.title}</Link>
                    </h3>
                    <span className="field-hint">
                      ₹{listing.price.toLocaleString("en-IN")} · Preview listing
                    </span>
                  </div>
                  <StatusBadge status={listing.status} />
                  <Link
                    className="dashboard-item-link"
                    href={`/listings/${listing.id}`}
                    aria-label={`View ${listing.title}`}
                  >
                    View ↗
                  </Link>
                  <ListingActions id={String(listing.id)} initialCategory={listing.category} initialPrice={listing.price} />
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span aria-hidden="true">＋</span>
              <h3>No listings yet</h3>
              <p>Your listings will appear here after you create one.</p>
              <Link className="button button-dark" href="/sell">
                Create a listing
              </Link>
            </div>
          )}
        </section>

        <section className="dashboard-section" aria-labelledby="recent-activity">
          <div className="section-heading dashboard-section-heading">
            <div>
              <span className="eyebrow">ACCOUNT ACTIVITY</span>
              <h2 id="recent-activity">Recent activity &amp; orders</h2>
            </div>
            <Link href="/" className="text-link">
              Browse marketplace ↗
            </Link>
          </div>
          <div className="activity-subsection">
            <h3>Requests &amp; orders</h3>
            <div className="activity-list">
              {studentOrders.rows.map((order) => (
                <article className="activity-row" key={order.order_id}>
                  <span className="activity-mark" aria-hidden="true">
                    ↗
                  </span>
                  <div>
                    <h3>Order #{order.order_id}</h3>
                    <p>₹{Number(order.total_amount).toLocaleString("en-IN")} · {new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </article>
              ))}
            </div>
          </div>
          <div className="activity-subsection">
            <h3>Recent activity</h3>
            {studentOrders.rows.length > 0 ? (
              <div className="activity-list">
                {studentOrders.rows.map((activity) => (
                  <article className="activity-row" key={`activity-${activity.order_id}`}>
                    <span className="activity-mark" aria-hidden="true">
                      ✳
                    </span>
                    <div>
                      <h3>Order #{activity.order_id} updated</h3>
                      <p>{activity.status} · ₹{Number(activity.total_amount).toLocaleString("en-IN")}</p>
                    </div>
                    <StatusBadge status={activity.status} />
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state compact-empty">
                <h3>No recent activity</h3>
                <p>
                  Activity will appear here when you start using CampusTrade.
                </p>
              </div>
            )}
          </div>
          <p className="dashboard-disclaimer">
            Orders and statuses above are database-backed account records.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
