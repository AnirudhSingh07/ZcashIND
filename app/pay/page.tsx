import type { Metadata } from "next";
import { site } from "@/config/site";
import { Container, Section, Badge, ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "Pay with ZEC",
  description:
    "How paying with Zcash works in India, and where to find merchants — on ZecMap.",
};

export default function PayPage() {
  return (
    <Section>
      <Container className="max-w-3xl">
        <Badge tone="gold" className="mb-4">
          Pay with ZEC
        </Badge>
        <h1 className="text-4xl font-bold sm:text-5xl">Spending Zcash in India</h1>
        <p className="mt-4 text-lg text-muted">
          Yes — merchants across India already accept ZEC. Paying is as simple as
          scanning a QR code from your wallet. Here's how it works, and where to
          find places that accept it.
        </p>

        <div className="prose mt-8">
          <h2>How a ZEC payment works</h2>
          <ol>
            <li>The merchant shows you their Zcash address or a QR code.</li>
            <li>You open your wallet, scan, and enter the amount.</li>
            <li>You confirm. The payment settles — shielded, if you both support it.</li>
          </ol>
          <p>
            No card network, no chargebacks, and — with shielded payments — no
            public record of what you bought.
          </p>
        </div>

        <div className="card mt-8 p-6">
          <h2 className="text-xl font-semibold">Find merchants on ZecMap</h2>
          <p className="mt-2 text-muted">
            ZecMap is the community map of merchants and meetups that accept and
            support Zcash — including in India. We point you there instead of
            building a second merchant database. If you run a shop that accepts
            ZEC, add yourself on ZecMap so others can find you.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <ButtonLink href={site.links.zecmap} external>
              Browse ZecMap
            </ButtonLink>
            <ButtonLink href={site.links.zecmapAdd} variant="ghost" external>
              Add your merchant
            </ButtonLink>
          </div>
        </div>

        <p className="mt-8 text-sm text-muted/70">
          Zcash India is a grassroots community, not a payment processor and not
          an exchange. This isn't financial advice.
        </p>
      </Container>
    </Section>
  );
}
