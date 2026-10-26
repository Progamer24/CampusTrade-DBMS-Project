"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/site-shell";

type Listing = { id: string; title: string; description: string; category: string; condition: string; price: number; seller: string; status: string };
type Review = { rating: number; reviewText: string; createdAt: string };
const visuals: Record<string, { color: string; emoji: string }> = { Books: { color: "lavender", emoji: "📚" }, Electronics: { color: "blue", emoji: "🎧" }, Accessories: { color: "peach", emoji: "🎒" }, Other: { color: "mint", emoji: "✳" } };

export default function ListingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [checkoutState, setCheckoutState] = useState("");
  const [checkoutBusy, setCheckoutBusy] = useState(false);

  useEffect(() => {
    Promise.all([fetch(`/api/listings/${id}`), fetch(`/api/listings/${id}/reviews`)]).then(async ([listingResponse, reviewsResponse]) => {
      const listingBody = await listingResponse.json();
      if (!listingResponse.ok) throw new Error(listingBody.error?.message || "Listing not found.");
      setProduct(listingBody.listing);
      if (reviewsResponse.ok) setReviews((await reviewsResponse.json()).reviews);
    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Listing unavailable.")).finally(() => setLoading(false));
  }, [id]);

  async function checkout() {
    setCheckoutBusy(true);
    setCheckoutState("");
    const response = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ itemId: id, checkoutKey: `${id}-${crypto.randomUUID()}` }) });
    const body = await response.json().catch(() => null);
    setCheckoutBusy(false);
    if (response.status === 401) { router.push("/login"); return; }
    if (!response.ok) { setCheckoutState(body?.error?.message || "Checkout could not be completed."); return; }
    setCheckoutState(`Purchase complete. Order ${body.orderId} is ${body.status.toLowerCase()}.`);
    setProduct((current) => current ? { ...current, status: "Sold" } : current);
  }

  if (loading) return <><SiteHeader /><main className="not-found-page"><section className="not-found" aria-busy="true"><p>Loading listing...</p></section></main><SiteFooter /></>;
  if (error || !product) return <><SiteHeader /><main className="not-found-page"><section className="not-found"><span>⌕</span><h1>Looks like this find is missing.</h1><p>{error || "This listing is not available."}</p><Link href="/" className="button button-dark">← Back to marketplace</Link></section></main><SiteFooter /></>;
  const visual = visuals[product.category] || visuals.Other;
  return <main><SiteHeader /><div className="detail-wrap"><div className="breadcrumbs"><Link href="/">Marketplace</Link><span>/</span><span>{product.category}</span><span>/</span><strong>{product.title}</strong></div><div className="detail-layout"><div className={`detail-visual ${visual.color}`}><span className="condition-pill">{product.condition}</span><span className="detail-emoji">{visual.emoji}</span><span className="detail-visual-caption">PRE-LOVED. READY FOR MORE.</span></div><section className="detail-content"><span className="eyebrow">{product.category.toUpperCase()} · CAMPUS LISTING</span><h1>{product.title}</h1><div className="detail-price">₹{product.price.toLocaleString("en-IN")} <span>Listed price</span></div><p className="detail-description">{product.description}</p><div className="detail-facts"><div><span>CONDITION</span><strong>{product.condition}</strong></div><div><span>SELLER</span><strong>{product.seller}</strong></div><div><span>STATUS</span><strong>{product.status}</strong></div></div><div className="detail-actions"><button className="button button-dark" disabled={checkoutBusy || product.status !== "Available"} onClick={checkout}>{checkoutBusy ? "Processing..." : product.status === "Available" ? "Buy this item" : "Unavailable"} <span>↗</span></button><button className={`button button-outline ${saved ? "saved-outline" : ""}`} onClick={() => setSaved(!saved)}>{saved ? "♥ Saved" : "♡ Save listing"}</button></div>{checkoutState && <div className="detail-notice" role="status">{checkoutState}</div>}<div className="seller-card"><div className="seller-avatar">{product.seller.charAt(0)}</div><div><span className="seller-label">LISTED BY</span><strong>{product.seller}</strong><small>Campus community member</small></div><span className="seller-verified">✳ Student seller</span></div><div className="activity-subsection"><h3>Reviews</h3>{reviews.length ? <div className="activity-list">{reviews.map((review, index) => <article className="activity-row" key={`${review.createdAt}-${index}`}><span className="activity-mark">★</span><div><h3>{"★".repeat(review.rating)}</h3><p>{review.reviewText}</p></div></article>)}</div> : <p className="field-hint">No reviews yet.</p>}</div></section></div><Link href="/" className="back-link">← Back to all listings</Link></div><SiteFooter /></main>;
}