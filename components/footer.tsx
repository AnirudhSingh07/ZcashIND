import Link from "next/link";
import { site } from "@/config/site";

const COL_SITE = [
  { href: "/learn", label: "Learn" },
  { href: "/map", label: "Map" },
  { href: "/events", label: "Events" },
  { href: "/updates", label: "What's New" },
  { href: "/bounties/irl", label: "IRL Bounty" },
  { href: "/host", label: "Host kit" },
  { href: "/contributors", label: "Contributors" },
];

const COL_ECO = [
  { href: site.links.zechub, label: "ZecHub", ext: true },
  { href: site.links.zecmap, label: "ZecMap", ext: true },
  { href: site.links.zcash, label: "z.cash", ext: true },
];

const COL_COMMUNITY = [
  { href: site.links.telegram, label: "Telegram", ext: true },
  { href: site.links.x, label: "X", ext: true },
  { href: site.links.youtube, label: "YouTube", ext: true },
];

function FooterLink({
  href,
  label,
  ext,
}: {
  href: string;
  label: string;
  ext?: boolean;
}) {
  if (ext) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-muted hover:text-gold"
      >
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className="text-sm text-muted hover:text-gold">
      {label}
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <div className="text-lg font-bold">{site.wordmark}</div>
            <p className="mt-2 max-w-xs text-sm text-muted">{site.tagline}</p>
            <p className="mt-4 text-xs text-muted/70">
              A grassroots community. Not the Zcash Foundation. Not a VASP.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gold">
              Explore
            </p>
            {COL_SITE.map((l) => (
              <FooterLink key={l.href} {...l} />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gold">
              Ecosystem
            </p>
            {COL_ECO.map((l) => (
              <FooterLink key={l.href} {...l} />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gold">
              Community
            </p>
            {COL_COMMUNITY.map((l) => (
              <FooterLink key={l.href} {...l} />
            ))}
            <a href={site.links.donation} className="text-sm text-muted hover:text-gold">
              Donate (soon)
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-line pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted/70">
            © {new Date().getFullYear()} {site.name}. {site.legal}
          </p>
          <div className="flex gap-4">
            <Link href="/disclaimer" className="text-xs text-muted/70 hover:text-gold">
              Disclaimer
            </Link>
            <Link href="/privacy" className="text-xs text-muted/70 hover:text-gold">
              Privacy
            </Link>
            <Link href="/about" className="text-xs text-muted/70 hover:text-gold">
              About
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
