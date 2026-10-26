"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/site-shell";

type Listing = { id: string; title: string; category: string; condition: string; price: number; seller: string };
const categories = ["All items", "Books", "Electronics", "Accessories", "Other"];
const visuals: Record<string, { color: string; emoji: string }> = { Books: { color: "lavender", emoji: "📚" }, Electronics: { color: "blue", emoji: "🎧" }, Accessories: { color: "peach", emoji: "🎒" }, Other: { color: "mint", emoji: "✳" } };

export default function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All items");
  const [sort, setSort] = useState("featured");
  const [products, setProducts] = useState<Listing[]>([]);
  const [savedProducts, setSavedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ limit: "50" });
    if (search.trim()) params.set("q", search.trim());
    if (category !== "All items") params.set("category", category);
    if (sort === "low") params.set("sort", "price_asc");
    if (sort === "high") params.set("sort", "price_desc");
    fetch(`/api/listings?${params}`, { signal: controller.signal })
      .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error?.message || "Listings are unavailable."); return body.listings as Listing[]; })
      .then(setProducts)
      .catch((reason: unknown) => { if (reason instanceof Error && reason.name !== "AbortError") setError(reason.message); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [search, category, sort]);

  function toggleSaved(id: string) { setSavedProducts((current) => current.includes(id) ? current.filter((savedId) => savedId !== id) : [...current, id]); }

  return (
    <main>
      <SiteHeader />
      <section className="hero"><div className="hero-copy"><span className="eyebrow"><span className="eyebrow-dot" /> YOUR CAMPUS. YOUR COMMUNITY.</span><h1>Good finds.<br /><em>Better campus</em> living.</h1><p>Buy, sell, and pass it on. Discover pre-loved essentials from people who study where you do.</p><a className="button button-dark hero-cta" href="#marketplace">Explore the marketplace <span>↘</span></a><div className="hero-note"><span className="avatar-stack"><i>A</i><i>R</i><i>M</i></span><span><strong>Made for campus life</strong><small>Affordable finds, right around you.</small></span></div></div><div className="hero-art" aria-label="Illustration of campus marketplace items"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-sticker sticker-top">PRE-LOVED<br />PREFERRED <span>✳</span></div><div className="art-book"><span>FIELD<br />NOTES</span><b>01</b></div><div className="art-bag">🎒</div><div className="art-headphones">🎧</div><div className="art-calc">▦<small>123</small></div><div className="art-sticker sticker-bottom">PASS IT ON ↗</div><span className="sparkle sparkle-one">✳</span><span className="sparkle sparkle-two">✦</span></div></section>
      <section className="trust-strip"><div><span>↗</span><p><strong>Student to student</strong><small>Trade with your campus community</small></p></div><div><span>♡</span><p><strong>Good for your wallet</strong><small>Find more for less</small></p></div><div><span>✳</span><p><strong>Give things a second life</strong><small>Less waste, more value</small></p></div></section>
      <section className="marketplace section-wrap" id="marketplace"><div className="section-heading"><div><span className="eyebrow">THE GOOD STUFF</span><h2>Find your next <em>favourite.</em></h2><p>Useful things, listed by students like you.</p></div><span className="listing-count">{loading ? "LOADING" : `${products.length} LISTINGS`}</span></div><div className="market-controls"><label className="search-box"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search books, tech, essentials..." aria-label="Search listings" />{search && <button onClick={() => setSearch("")} aria-label="Clear search">×</button>}</label><label className="sort-box"><span>Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label></div><div className="category-row">{categories.map((item) => <button key={item} className={`category-chip ${category === item ? "active" : ""}`} onClick={() => setCategory(item)}>{item}</button>)}</div>{error ? <div className="empty-state"><span>!</span><h3>Listings are unavailable</h3><p>{error}</p><button className="button button-dark" onClick={() => setSearch((value) => value)}>Retry</button></div> : loading ? <div className="empty-state" aria-busy="true"><span>⌕</span><h3>Finding good stuff</h3><p>Loading available campus listings...</p></div> : products.length ? <div className="product-grid">{products.map((product) => { const visual = visuals[product.category] || visuals.Other; return <article className="product-card" key={product.id}><Link href={`/listings/${product.id}`} className={`product-visual ${visual.color}`} aria-label={`View ${product.title}`}><span className="condition-pill">{product.condition}</span><span className="product-emoji">{visual.emoji}</span><span className="visual-arrow">↗</span></Link><div className="product-info"><div className="product-category">{product.category}</div><Link href={`/listings/${product.id}`} className="product-title">{product.title}</Link><div className="product-bottom"><strong>₹{product.price.toLocaleString("en-IN")}</strong><span className="seller-mini"><span className="seller-dot">{product.seller.charAt(0)}</span>{product.seller}</span></div><Link href={`/listings/${product.id}`} className="details-button">View details <span>↗</span></Link><button className={`save-button ${savedProducts.includes(product.id) ? "saved" : ""}`} onClick={() => toggleSaved(product.id)} aria-label={savedProducts.includes(product.id) ? "Remove saved listing" : "Save listing"}>{savedProducts.includes(product.id) ? "♥" : "♡"}</button></div></article>; })}</div> : <div className="empty-state"><span>⌕</span><h3>No listings found</h3><p>Try another search or category.</p><button className="button button-dark" onClick={() => { setSearch(""); setCategory("All items"); }}>Clear filters</button></div>}</section>
      <section className="sell-banner"><div className="sell-spark">✳</div><div><span className="eyebrow">READY TO PASS IT ON?</span><h2>Your shelf could be<br /><em>someone’s next find.</em></h2><p>List what you no longer need and help another student find their favourite.</p></div><Link href="/sell" className="button button-light">List an item <span>↗</span></Link></section>
      <SiteFooter />
    </main>
  );
}