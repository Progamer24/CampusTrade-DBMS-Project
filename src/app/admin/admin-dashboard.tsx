"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import type { AuthUser } from "@/lib/server/auth";

type ModerationStatus = "Pending" | "Flagged" | "Approved" | "Rejected";
type QueueItem = { listingId: string; status: ModerationStatus; category: string; price: number; seller: string; title: string };

export function AdminDashboard({
  queue: initialQueue,
  user,
}: {
  queue: readonly QueueItem[];
  user: AuthUser;
}) {
  const [queue, setQueue] = useState<QueueItem[]>(() => [...initialQueue]);
  const [notice, setNotice] = useState("");
  const [analytics, setAnalytics] = useState<{ overview?: { total_items: number; available_items: number; sold_items: number; completed_orders: number; completed_revenue: string }; byCategory?: { category: string; item_count: number }[] }>({});

  useEffect(() => { fetch("/api/admin/analytics").then((response) => response.ok ? response.json() : null).then((body) => { if (body) setAnalytics(body); }); }, []);

  async function updateStatus(listingId: string, status: ModerationStatus) {
    const action = status === "Approved" ? "approve" : status === "Rejected" ? "reject" : "flag";
    const response = await fetch(`/api/admin/moderation/listings/${listingId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setNotice(body?.error?.message || "Moderation update failed.");
      return;
    }
    setQueue((current) =>
      current.map((item) =>
        item.listingId === listingId ? { ...item, status } : item
      )
    );
    setNotice(
      `"${queue.find((item) => item.listingId === listingId)?.title || "Listing"}" is marked ${status.toLowerCase()}.`
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
        Admin access and moderation writes are verified on the server.
      </div>

      <section className="summary-grid admin-summary" aria-label="Mock moderation summary">
        <article className="summary-card">
          <span className="summary-icon">◷</span>
          <span className="summary-label">AWAITING REVIEW</span>
          <strong>{pendingCount}</strong>
          <small>Database listing queue</small>
        </article>
        <article className="summary-card">
          <span className="summary-icon">⚑</span>
          <span className="summary-label">FLAGGED LISTINGS</span>
          <strong>{flaggedCount}</strong>
          <small>Database listing queue</small>
        </article>
        <article className="summary-card">
          <span className="summary-icon">▦</span>
          <span className="summary-label">SAMPLE LISTINGS</span>
          <strong>{queue.length}</strong>
          <small>Database listing records</small>
        </article>
      </section>

      <section className="dashboard-section" aria-labelledby="moderation-queue">
        <div className="section-heading dashboard-section-heading">
          <div>
            <span className="eyebrow">LISTING MODERATION · LIVE DATA</span>
            <h2 id="moderation-queue">Moderation queue</h2>
          </div>
          <span className="listing-count">{queue.length} RECORDS</span>
        </div>

        {notice && (
          <p className="form-success moderation-notice" role="status">
            {notice}
          </p>
        )}

        {queue.length > 0 ? (
          <div className="moderation-list">
            {queue.map((item) => {
              return (
                <article className="moderation-card" key={item.listingId}>
                  <div className="dashboard-item-icon mint">
                    <span aria-hidden="true">✳</span>
                  </div>
                  <div className="moderation-copy">
                    <span className="product-category">{item.category}</span>
                    <h3>{item.title}</h3>
                    <p>
                      Listed by {item.seller} · ₹{item.price.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                  <div className="moderation-actions" aria-label={`Actions for ${item.title}`}>
                    <Link className="text-link" href={`/listings/${item.listingId}`}>
                      View
                    </Link>
                    <button
                      className="moderation-action approve-action"
                      type="button"
                      onClick={() => updateStatus(item.listingId, "Approved")}
                    >
                      Approve
                    </button>
                    <button
                      className="moderation-action flag-action"
                      type="button"
                      onClick={() => updateStatus(item.listingId, "Flagged")}
                    >
                      Flag
                    </button>
                    <button
                      className="moderation-action reject-action"
                      type="button"
                      onClick={() => updateStatus(item.listingId, "Rejected")}
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
            <span className="eyebrow">DATABASE ANALYTICS</span>
            <h2 id="moderation-activity">Marketplace overview</h2>
          </div>
        </div>
        <div className="activity-list"><article className="activity-row"><span className="activity-mark">▦</span><div><h3>{analytics.overview?.total_items ?? "-"} total listings</h3><p>{analytics.overview?.available_items ?? "-"} available · {analytics.overview?.sold_items ?? "-"} sold</p></div><StatusBadge status="Live" /></article><article className="activity-row"><span className="activity-mark">₹</span><div><h3>{analytics.overview?.completed_orders ?? "-"} completed orders</h3><p>₹{Number(analytics.overview?.completed_revenue || 0).toLocaleString("en-IN")} completed revenue</p></div><StatusBadge status="Live" /></article></div>
        <p className="dashboard-disclaimer">
          Analytics are calculated from PostgreSQL views and MongoDB review aggregation.
        </p>
      </section>
    </main>
  );
}
