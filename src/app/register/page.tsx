import { AuthForm } from "@/components/auth-form";
import { SiteFooter, SiteHeader } from "@/components/site-shell";

export default function RegisterPage() {
  return (
    <>
      <SiteHeader />
      <AuthForm mode="register" />
      <SiteFooter />
    </>
  );
}
