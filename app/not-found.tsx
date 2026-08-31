import { Container, Section, ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <Section>
      <Container className="max-w-lg">
        <div className="card p-10 text-center">
          <div className="text-5xl font-bold text-gold">404</div>
          <h1 className="mt-4 text-2xl font-bold">This page isn&apos;t on the map</h1>
          <p className="mt-2 text-muted">
            The link may be old, or the city just needs a host.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/">Go home</ButtonLink>
            <ButtonLink href="/map" variant="ghost">
              See the map
            </ButtonLink>
          </div>
        </div>
      </Container>
    </Section>
  );
}
