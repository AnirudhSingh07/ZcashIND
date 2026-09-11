import type { Metadata } from "next";
import { Container, Section, Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How this site handles the little data it collects.",
};

export default function PrivacyPage() {
  return (
    <Section>
      <Container className="max-w-3xl">
        <Badge tone="gold" className="mb-4">
          Privacy
        </Badge>
        <h1 className="text-4xl font-bold sm:text-5xl">Privacy on this site</h1>
        <div className="prose mt-8">
          <p className="lead">
            We practise what we teach. This site collects as little as possible.
          </p>

          <h2>What we collect</h2>
          <ul>
            <li>
              <strong>Meetup submissions.</strong> When you submit a meetup, we
              store what you enter, including your photos and a private contact
              method, so our team can review it.
            </li>
            <li>
              <strong>Nothing else by default.</strong> No accounts, no wallet
              connection, no tracking pixels required to use the site.
            </li>
          </ul>

          <h2>Your private contact stays private</h2>
          <p>
            The private contact you provide when submitting a meetup (Telegram, X
            or email) is used <strong>only</strong> for our team to reach you
            about your submission. It is never shown publicly on the map, city
            pages, or anywhere else.
          </p>

          <h2>What appears publicly</h2>
          <p>
            If your meetup is verified, its public details (city, title, date,
            attendee counts, your chosen public host name, and photos) appear on
            the map. Your private contact does not.
          </p>

          <h2>Photos</h2>
          <p>
            Only submit photos you have the right to share, and where attendees
            are comfortable being shown. For the MVP, uploaded photos are stored
            with the site.
          </p>

          <h2>Questions</h2>
          <p>
            Reach us on <a href="/community">any community channel</a> if you want
            a submission or photo removed.
          </p>
        </div>
      </Container>
    </Section>
  );
}
