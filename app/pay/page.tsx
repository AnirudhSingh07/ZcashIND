import type { Metadata } from "next";
import { site } from "@/config/site";
import { merchants, merchantCountIndia, merchantLinks } from "@/config/merchants";
import { Container, Section, Badge, ButtonLink } from "@/components/ui";
import { IndiaMap } from "@/components/india-map";

export const metadata: Metadata = {
  title: "Pay with ZEC",
  description:
    "Indian businesses that accept Zcash, how a ZEC payment works, and how to get your own shop listed on ZecMap.",
};

const STEPS = [
  {
    t: "The shop shows a QR code",
    d: "Every ZEC-accepting business has a Zcash address. Most show it as a QR code at the counter or on their ZecMap listing.",
  },
  {
    t: "You scan it from your wallet",
    d: "Open Zashi or Zodl, tap Send, scan the code and type the amount. Shielded by default when both sides support it.",
  },
  {
    t: "You confirm. Done.",
    d: "The payment settles in about a minute. No card network, no chargebacks, and no public record of what you bought.",
  },
];

export default function PayPage() {
  const unlisted = Math.max(0, merchantCountIndia - merchants.length);

  return (
    <Section className="py-8">
      <Container>
        {/* Hero */}
        <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-gold/30 bg-gradient-to-br from-gold/10 via-surface to-bg p-8 sm:p-12">
          <IndiaMap
            variant="outline"
            className="pointer-events-none absolute -right-6 top-1/2 hidden h-[140%] -translate-y-1/2 opacity-15 sm:block"
          />
          <div className="relative max-w-2xl">
            <Badge tone="gold" className="mb-4">
              Pay with ZEC
            </Badge>
            <h1 className="text-4xl font-bold sm:text-5xl">Spending Zcash in India</h1>
            <p className="mt-4 text-lg text-muted">
              Yes, you can. {merchantCountIndia} businesses in India already accept ZEC, and the list is
              growing one shop at a time. Paying is as simple as scanning a QR code.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="#merchants">See who accepts ZEC</ButtonLink>
              <ButtonLink href="/learn/wallets" variant="ghost">
                Get a wallet first
              </ButtonLink>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold">How a ZEC payment works</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.t} className="card p-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-bright font-bold text-text">
                  {i + 1}
                </div>
                <h3 className="mt-3 font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted">{s.d}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Merchants */}
        <div id="merchants" className="mt-14 scroll-mt-24">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-bold">Businesses that accept ZEC in India</h2>
              <p className="mt-1 max-w-xl text-muted">
                Listed on ZecMap, the community directory of Zcash-accepting merchants worldwide.
              </p>
            </div>
            <ButtonLink href={merchantLinks.browse} variant="ghost" external>
              Browse all on ZecMap
            </ButtonLink>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {merchants.map((m) => (
              <a
                key={m.zecmapUrl}
                href={m.zecmapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="card group flex flex-col p-6 transition-colors hover:border-gold/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge tone="gold">{m.category}</Badge>
                  <Badge tone="success">Accepts {m.accepts}</Badge>
                </div>
                <h3 className="mt-3 text-lg font-semibold group-hover:text-gold">{m.name}</h3>
                <p className="text-sm text-muted">
                  📍 {m.city}
                  {m.state ? `, ${m.state}` : ""}
                </p>
                {m.note && <p className="mt-3 text-sm text-muted/80">{m.note}</p>}
                <span className="mt-auto pt-4 text-sm text-gold group-hover:underline">View on ZecMap ↗</span>
              </a>
            ))}

            {unlisted > 0 && (
              <a
                href={merchantLinks.browse}
                target="_blank"
                rel="noopener noreferrer"
                className="card-2 flex flex-col items-center justify-center p-6 text-center transition-colors hover:border-gold/50"
              >
                <div className="text-3xl">🗺️</div>
                <h3 className="mt-2 font-semibold">
                  {unlisted} more {unlisted === 1 ? "business" : "businesses"} on ZecMap
                </h3>
                <p className="mt-1 text-sm text-muted">
                  Filter the ZecMap map to India to see every listing.
                </p>
                <span className="mt-3 text-sm text-gold">Open ZecMap ↗</span>
              </a>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="card mt-14 border-gold/40 bg-gold/5 p-8 sm:p-10">
          <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <h2 className="text-2xl font-bold">Want your business listed?</h2>
              <p className="mt-2 max-w-xl text-muted">
                Any shop, café, freelancer or service in India can accept ZEC. You need a wallet and five
                minutes. Add yourself on ZecMap, or message us on Telegram and a Zcash India volunteer will
                walk you through it.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <ButtonLink href={merchantLinks.add} external>
                Add your business on ZecMap
              </ButtonLink>
              <ButtonLink href={site.links.telegram} variant="ghost" external>
                Ask for help on Telegram
              </ButtonLink>
            </div>
          </div>
        </div>

        <p className="mt-8 text-sm text-muted/70">
          Zcash India is a grassroots community, not a payment processor and not an exchange. This isn't
          financial advice. Merchants listed on ZecMap are added by the community; check the listing before
          you travel.
        </p>
      </Container>
    </Section>
  );
}
