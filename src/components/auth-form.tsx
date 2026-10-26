"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";

type AuthMode = "login" | "register";
type AuthFormProps = { mode: AuthMode };

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const id = useId();
  const isRegister = mode === "register";
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");

    if (!email || !email.includes("@")) {
      setError("Enter a valid campus email address.");
      return;
    }
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    try {
      const response = await fetch(`/api/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          fullName: data.get("fullName"),
          email,
          password,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      if (!response.ok) {
        setError(payload?.error?.message ?? "We could not complete that request.");
        return;
      }
      setSubmitted(true);
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("We could not reach CampusTrade. Try again.");
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby={`${id}-heading`}>
        <span className="eyebrow">{isRegister ? "JOIN THE COMMUNITY" : "WELCOME BACK"}</span>
        <h1 id={`${id}-heading`}>{isRegister ? "Create your account." : "Good to see you."}</h1>
        <p className="auth-intro">{isRegister ? "Start buying and selling useful finds with your campus community." : "Sign in to keep track of your campus finds."}</p>
        <div className="preview-note" role="note">Secure account access · Your session is stored in an HTTP-only cookie.</div>
        {submitted && <p className="form-success" role="status">Account ready. Redirecting to your dashboard.</p>}
        <form className="form-stack" onSubmit={handleSubmit} noValidate>
          {isRegister && <div className="form-field"><label htmlFor={`${id}-name`}>Full name</label><input id={`${id}-name`} name="fullName" type="text" placeholder="e.g. Aarav Sharma" autoComplete="name" aria-invalid={Boolean(error)} required /></div>}
          <div className="form-field"><label htmlFor={`${id}-email`}>Campus email</label><input id={`${id}-email`} name="email" type="email" placeholder="you@campus.edu" autoComplete="email" aria-invalid={Boolean(error)} required /></div>
          {isRegister && <div className="form-field"><label htmlFor={`${id}-student-id`}>Student ID <span className="optional-label">Optional</span></label><input id={`${id}-student-id`} name="studentId" type="text" placeholder="e.g. CT2024018" /></div>}
          <div className="form-field"><label htmlFor={`${id}-password`}>Password</label><div className="password-control"><input id={`${id}-password`} name="password" type={showPassword ? "text" : "password"} autoComplete={isRegister ? "new-password" : "current-password"} aria-invalid={Boolean(error)} required /><button className="password-toggle" type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button></div></div>
          {isRegister && <div className="form-field"><label htmlFor={`${id}-confirm-password`}>Confirm password</label><input id={`${id}-confirm-password`} name="confirmPassword" type={showPassword ? "text" : "password"} aria-invalid={Boolean(error)} required /></div>}
          {error && <span className="field-error" role="alert">{error}</span>}
          <button className="button button-dark form-submit" type="submit">{isRegister ? "Create account" : "Sign in"}<span aria-hidden="true">↗</span></button>
        </form>
        <p className="auth-switch">{isRegister ? "Already have an account?" : "New to CampusTrade?"} <Link href={isRegister ? "/login" : "/register"}>{isRegister ? "Sign in" : "Create an account"}</Link></p>
        <Link className="auth-back-link" href="/">← Back to marketplace</Link>
      </section>
    </main>
  );
}