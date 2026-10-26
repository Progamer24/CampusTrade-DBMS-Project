"use client";

import { useState } from "react";

export function ListingActions({ id, initialCategory, initialPrice }: { id: string; initialCategory: string; initialPrice: number }) {
  const [category, setCategory] = useState(initialCategory);
  const [price, setPrice] = useState(String(initialPrice));
  const [message, setMessage] = useState("");
  const [removed, setRemoved] = useState(false);

  async function save() {
    const response = await fetch(`/api/listings/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ category, price: Number(price) }) });
    const body = await response.json().catch(() => null);
    setMessage(response.ok ? "Listing updated." : body?.error?.message || "Update failed.");
  }

  async function remove() {
    if (!window.confirm("Remove this listing from the marketplace?")) return;
    const response = await fetch(`/api/listings/${id}`, { method: "DELETE" });
    const body = await response.json().catch(() => null);
    if (!response.ok) { setMessage(body?.error?.message || "Remove failed."); return; }
    setRemoved(true);
  }

  if (removed) return <span className="field-hint">Listing removed.</span>;
  return <details><summary className="text-link">Manage listing</summary><div className="form-field"><label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}><option>Books</option><option>Electronics</option><option>Accessories</option><option>Other</option></select></label><label>Price<input type="number" min="0.01" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} /></label><div><button className="button button-dark" type="button" onClick={save}>Save</button> <button className="text-link" type="button" onClick={remove}>Remove</button></div>{message && <span className="field-hint" role="status">{message}</span>}</div></details>;
}