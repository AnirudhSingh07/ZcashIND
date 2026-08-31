import Link from "next/link";
import { logoutAction } from "@/app/actions/admin";

export function AdminNav() {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
      <nav className="flex flex-wrap gap-1">
        {[
          ["/admin", "Dashboard"],
          ["/admin/submissions", "Submissions"],
          ["/admin/events", "Events"],
        ].map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="rounded-full px-3 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-gold"
          >
            {label}
          </Link>
        ))}
      </nav>
      <form action={logoutAction}>
        <button className="btn-ghost px-4 py-1.5 text-sm">Log out</button>
      </form>
    </div>
  );
}
