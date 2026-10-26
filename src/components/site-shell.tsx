import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="CampusTrade home">
        <span className="brand-mark" aria-hidden="true">C</span>
        <span><strong>CampusTrade</strong><small>THE CAMPUS MARKETPLACE</small></span>
      </Link>
      <nav className="header-actions" aria-label="Primary navigation">
        <Link className="text-link" href="/dashboard">Dashboard</Link>
        <Link className="button button-dark" href="/sell">Sell an item <span aria-hidden="true">↗</span></Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link className="brand footer-brand" href="/" aria-label="CampusTrade home">
        <span className="brand-mark" aria-hidden="true">C</span>
        <span><strong>CampusTrade</strong><small>STUDENT TO STUDENT</small></span>
      </Link>
      <nav aria-label="Footer navigation">
        <Link href="/">Marketplace</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/admin">Admin preview</Link>
      </nav>
      <p>Made for campus life · Preview mode</p>
    </footer>
  );
}