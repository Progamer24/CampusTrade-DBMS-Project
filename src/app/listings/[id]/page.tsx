"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { listings } from "@/lib/mock-data";

export default function ListingDetailsPage() {
  return (
    <Suspense
      fallback={
        <main className="not-found-page" aria-busy="true">
          <section className="not-found">
            <p>Loading listing...</p>
          </section>
        </main>
      }
    >
      <ListingDetails />
    </Suspense>
  );
}

function ListingDetails() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const product = listings.find((item) => item.id === id);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState("");

  if (!product) {
    return <><SiteHeader /><main className="not-found-page"><section className="not-found"><span>⌕</span><h1>Looks like this find is missing.</h1><p>This listing does not exist in our current preview.</p><Link href="/" className="button button-dark">← Back to marketplace</Link></section></main><SiteFooter /></>;
  }

  return (
    <main>
      <SiteHeader />
      <div className="detail-wrap">
        <div className="breadcrumbs"><Link href="/">Marketplace</Link><span>/</span><span>{product.category}</span><span>/</span><strong>{product.title}</strong></div>
        <div className="detail-layout">
          <div className={`detail-visual ${product.color}`}><span className="condition-pill">{product.condition}</span><span className="detail-emoji">{product.emoji}</span><span className="detail-visual-caption">PRE-LOVED. READY FOR MORE.</span></div>
          <section className="detail-content">
            <span className="eyebrow">{product.category.toUpperCase()} · CAMPUS LISTING</span>
            <h1>{product.title}</h1>
            <div className="detail-price">₹{product.price.toLocaleString("en-IN")} <span>Listed price</span></div>
            <p className="detail-description">{product.description}</p>
            <div className="detail-facts"><div><span>CONDITION</span><strong>{product.condition}</strong></div><div><span>POSTED</span><strong>{product.posted}</strong></div><div><span>ITEM TYPE</span><strong>{product.category}</strong></div></div>
            <div className="detail-actions"><button className="button button-dark" onClick={() => setNotice("Contact options will be enabled when the backend is connected.")}>Contact seller <span>↗</span></button><button className={`button button-outline ${saved ? "saved-outline" : ""}`} onClick={() => setSaved(!saved)}>{saved ? "♥ Saved" : "♡ Save listing"}</button></div>
            {notice && <div className="detail-notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss message">×</button></div>}
            <div className="seller-card"><div className="seller-avatar">{product.seller.charAt(0)}</div><div><span className="seller-label">LISTED BY</span><strong>{product.seller}</strong><small>Campus community member</small></div><span className="seller-verified">✳ Student seller</span></div>
            <p className="detail-footnote">This is a project preview using sample listings. Messaging and checkout will be connected during backend integration.</p>
          </section>
        </div>
        <Link href="/" className="back-link">← Back to all listings</Link>
      </div>
      <SiteFooter />
    </main>
  );
}
