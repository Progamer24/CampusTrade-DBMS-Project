"use client";

import Link from "next/link";
import { useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import type { AuthUser } from "@/lib/server/auth";
import { listings, type Listing } from "@/lib/mock-data";

type ModerationStatus = "Pending" | "Flagged" | "Approved" | "Rejected";
type QueueItem = { listingId: number; status: ModerationStatus };

const mockUserActivity = [
  { id: "user-report", title: "A demo user report was received", detail: "Sample report · 35 minutes ago" },
  { id: "user-review", title: "A mock student profile was reviewed", detail: "Demo moderation activity · Yesterday" },
];

function getListing(listingId: number): Listing | undefined {
  return listings.find((listing) => listing.id === listingId);
}

export function AdminDashboard({
  queue: initialQueue,
  user,
}: {
  queue: readonly { listingId: number; status: "Pending" | "Flagged" }[];
  user: AuthUser;
}) {
  const [queue, setQueue] = useState<QueueItem[]>(() =>
    initialQueue.flatMap((item) => {
      const listing = getListing(item.listingId);
      return listing
        ? [{ listingId: item.listingId, status: item.status }]
        : [];
    })
  );
  const [notice, setNotice] = useState("");

  function updateStatus(listingId: number, status: ModerationStatus) {
    const listing = getListing(listingId);
    if (!listing) return;

    setQueue((current) =>
      current.map((item) =>
        item.listingId === listingId ? { ...item, status } : item
      )
    );
    setNotice(
      `Preview only: "${listing.title}" is marked ${status.toLowerCase()} on this page. The change was not saved.`
    );
  }

  const pendingCount = queue.filter((item) => item.status === "Pending").length;
  const flaggedCount = queue.filter((item) => item.status === "Flagged").length;

  return (
    <main className="page-container admin-page">
      <div className="page-intro">
        <div>
          <span className="eyebrow">CAMPUS MARKETPLACE · MODERATION</span>
          <h1>Admin review desk</h1>
          <p>Review marketplace activity as {user.email}.</p>
        </div>
        <span className="demo-stamp">CAMPUS ADMIN ACCESS</span>
      </div>

      <div className="preview-note" role="note">
        Admin access is verified on the server. Moderation data remains preview content until listing APIs are implemented.
      </div>

      <section className="summary-grid admin-summary" aria-label="Mock moderation summary">
        <article className="summary-card">
          <span className="summary-icon">◷</span>
          <span className="summary-label">AWAITING REVIEW</span>
          <strong>{pendingCount}</strong>
          <small>Current demo queue</small>
        </article>
        <article className="summary-card">
          <span className="summary-icon">⚑</span>
          <span className="summary-label">FLAGGED LISTINGS</span>
          <strong>{flaggedCount}</strong>
          <small>Current demo queue</small>
        </article>
        <article className="summary-card">
          <span className="summary-icon">▦</span>
          <span className="summary-label">SAMPLE LISTINGS</span>
          <strong>{listings.length}</strong>
          <small>Static preview records</small>
        </article>
      </section>

      <section className="dashboard-section" aria-labelledby="moderation-queue">
        <div className="section-heading dashboard-section-heading">
          <div>
            <span className="eyebrow">LISTING MODERATION · MOCK DATA</span>
            <h2 id="moderation-queue">Moderation queue</h2>
          </div>
          <span className="listing-count">{queue.length} DEMO RECORDS</span>
        </div>

        {notice && (
          <p className="form-success moderation-notice" role="status">
            {notice}
          </p>
        )}

        {queue.length > 0 ? (
          <div className="moderation-list">
            {queue.map((item) => {
              const listing = getListing(item.listingId);
              if (!listing) return null;

              return (
                <article className="moderation-card" key={listing.id}>
                  <div className={`dashboard-item-icon ${listing.color}`}>
                    <span aria-hidden="true">{listing.emoji}</span>
                  </div>
                  <div className="moderation-copy">
                    <span className="product-category">{listing.category}</span>
                    <h3>{listing.title}</h3>
                    <p>
                      Listed by {listing.seller} · ₹
                      {listing.price.toLocaleString("en-IN")} · {listing.condition}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                  <div className="moderation-actions" aria-label={`Preview actions for ${listing.title}`}>
                    <Link className="text-link" href={`/listings/${listing.id}`}>
                      View
                    </Link>
                    <button
                      className="moderation-action approve-action"
                      type="button"
                      onClick={() => updateStatus(listing.id, "Approved")}
                    >
                      Approve
                    </button>
                    <button
                      className="moderation-action flag-action"
                      type="button"
                      onClick={() => updateStatus(listing.id, "Flagged")}
                    >
                      Flag
                    </button>
                    <button
                      className="moderation-action reject-action"
                      type="button"
                      onClick={() => updateStatus(listing.id, "Rejected")}
                    >
                      Reject
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <span aria-hidden="true">✓</span>
            <h3>The demo queue is clear</h3>
            <p>Preview records have been reviewed on this page.</p>
          </div>
        )}
      </section>

      <section className="dashboard-section" aria-labelledby="moderation-activity">
        <div className="section-heading dashboard-section-heading">
          <div>
            <span className="eyebrow">USER &amp; LISTING ACTIVITY · MOCK</span>
            <h2 id="moderation-activity">Recent moderation activity</h2>
          </div>
        </div>
        <div className="activity-list">
          {mockUserActivity.map((activity) => (
            <article className="activity-row" key={activity.id}>
              <span className="activity-mark" aria-hidden="true">
                ✳
              </span>
              <div>
                <h3>{activity.title}</h3>
                <p>{activity.detail}</p>
              </div>
              <StatusBadge status="Demo" />
            </article>
          ))}
        </div>
        <p className="dashboard-disclaimer">
          All names, reports, counts and activity are fabricated demo content;
          no live user data or analytics are shown.
        </p>
      </section>
    </main>
  );
}
