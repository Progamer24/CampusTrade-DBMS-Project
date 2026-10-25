import { AuthForm } from "@/components/auth-form";
import { SiteFooter, SiteHeader } from "@/components/site-shell";

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <AuthForm mode="login" />
      <SiteFooter />
    </>
  );
}
