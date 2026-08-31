import type { Metadata } from "next";
import { Container, Section, Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Important notes about who Zcash India is and isn't.",
};

export default function DisclaimerPage() {
  return (
    <Section>
      <Container className="max-w-3xl">
        <Badge tone="gold" className="mb-4">
          Disclaimer
        </Badge>
        <h1 className="text-4xl font-bold sm:text-5xl">The important bits</h1>
        <div className="prose mt-8">
          <h2>Not an exchange, not a VASP</h2>
          <p>
            Zcash India is a grassroots community. We do not buy, sell, custody,
            or exchange ZEC or any other asset. We are not a virtual asset
            service provider.
          </p>

          <h2>Not financial advice</h2>
          <p>
            Nothing on this site is financial, investment, tax, or legal advice.
            We never tell you a price will go up or down. For decisions about
            money or taxes, consult a qualified professional.
          </p>

          <h2>Not official Zcash</h2>
          <p>
            We are an independent community. We are not the Zcash Foundation, not
            Electric Coin Co., and we don't speak for the protocol. We link to
            official resources like z.cash and ZecHub where relevant.
          </p>

          <h2>Legitimate use only</h2>
          <p>
            We teach financial privacy as a normal, legitimate thing. We do not
            help anyone break the law, launder money, evade taxes, or hide
            illicit funds. Content that asks for that kind of help isn't welcome
            in this community.
          </p>

          <h2>Safety</h2>
          <p>
            We will never DM you first asking for money or your seed phrase.
            Download wallets only from official sources. If something feels off,
            ask in the community before acting.
          </p>
        </div>
      </Container>
    </Section>
  );
}
