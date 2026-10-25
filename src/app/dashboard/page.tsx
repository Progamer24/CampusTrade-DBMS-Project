import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { StatusBadge } from "@/components/status-badge";
import {
  listings,
  mockRecentActivity,
  mockStudent,
  mockStudentOrders,
  mockStudentListings,
} from "@/lib/mock-data";

export default function DashboardPage() {
  const myListings = mockStudentListings.flatMap(({ listingId, status }) => {
    const listing = listings.find((item) => item.id === listingId);
    return listing ? [{ ...listing, status }] : [];
  });
  const activeListings = myListings.filter(
    (listing) => listing.status === "Active"
  ).length;
  const pendingItems = mockStudentOrders.filter(
    (order) => order.status === "Pending"
  ).length;
  const completedItems = mockStudentOrders.filter(
    (order) => order.status === "Completed"
  ).length;

  return (
    <>
      <SiteHeader />
      <main className="page-container dashboard-page">
        <div className="page-intro">
          <div>
            <span className="eyebrow">STUDENT DASHBOARD · DEMO DATA</span>
            <h1>Good to see you, {mockStudent.name.split(" ")[0]}.</h1>
            <p>Keep track of your campus listings and recent activity.</p>
          </div>
          <Link className="button button-dark" href="/sell">
            ＋ Create a listing
          </Link>
        </div>

        <div className="preview-note" role="note">
          Preview data only · This mock profile and its activity are not connected
          to a student account or database.
        </div>

        <section className="profile-card" aria-labelledby="profile-heading">
          <div className="profile-avatar" aria-hidden="true">
            AS
          </div>
          <div>
            <span className="eyebrow">MOCK STUDENT PROFILE</span>
            <h2 id="profile-heading">{mockStudent.name}</h2>
            <p>{mockStudent.email}</p>
            <span className="field-hint">
              Student ID: {mockStudent.studentId} · Demo value
            </span>
          </div>
          <Link href="/login" className="text-link profile-signin">
            Sign in to connect an account
          </Link>
        </section>

        <section className="summary-grid" aria-label="Demo account summary">
          <article className="summary-card">
            <span className="summary-icon">↗</span>
            <span className="summary-label">ACTIVE LISTINGS</span>
            <strong>{activeListings}</strong>
            <small>Mock items currently listed</small>
          </article>
          <article className="summary-card">
            <span className="summary-icon">◷</span>
            <span className="summary-label">PENDING REQUESTS</span>
            <strong>{pendingItems}</strong>
            <small>Mock buyer requests and orders</small>
          </article>
          <article className="summary-card">
            <span className="summary-icon">✓</span>
            <span className="summary-label">COMPLETED TRANSACTIONS</span>
            <strong>{completedItems}</strong>
            <small>Mock completed items</small>
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
              <span className="eyebrow">DEMO ACTIVITY</span>
              <h2 id="recent-activity">Recent activity &amp; orders</h2>
            </div>
            <Link href="/" className="text-link">
              Browse marketplace ↗
            </Link>
          </div>
          <div className="activity-subsection">
            <h3>Requests &amp; orders</h3>
            <div className="activity-list">
              {mockStudentOrders.map((order) => (
                <article className="activity-row" key={order.id}>
                  <span className="activity-mark" aria-hidden="true">
                    ↗
                  </span>
                  <div>
                    <h3>{order.title}</h3>
                    <p>{order.detail}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </article>
              ))}
            </div>
          </div>
          <div className="activity-subsection">
            <h3>Recent activity</h3>
            {mockRecentActivity.length > 0 ? (
              <div className="activity-list">
                {mockRecentActivity.map((activity) => (
                  <article className="activity-row" key={activity.id}>
                    <span className="activity-mark" aria-hidden="true">
                      ✳
                    </span>
                    <div>
                      <h3>{activity.title}</h3>
                      <p>{activity.detail}</p>
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
            Orders, statuses and activity above are sample UI content only.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
