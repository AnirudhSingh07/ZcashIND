import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { LoginForm } from "@/components/admin/login-form";
import { Container, Section, Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Admin login",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <Section>
      <Container className="max-w-sm">
        <Badge tone="gold" className="mb-4">
          Admin
        </Badge>
        <h1 className="text-2xl font-bold">Zcash India admin</h1>
        <p className="mt-2 text-sm text-muted">
          Review submissions and manage events. Team only.
        </p>
        <div className="card mt-6 p-6">
          <LoginForm />
        </div>
      </Container>
    </Section>
  );
}
