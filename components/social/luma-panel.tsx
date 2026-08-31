import { site } from "@/config/site";
import { ButtonLink } from "@/components/ui";

/**
 * Luma events panel. The Luma profile itself can't be iframed (it sends
 * X-Frame-Options: SAMEORIGIN), so we show a rich link-out card. Individual
 * events CAN be embedded via their Luma embed ID — add them to
 * config/site.ts → luma.featured to render live previews here.
 */
export function LumaPanel() {
  const { featured, profileUrl } = site.luma;

  return (
    <div>
      <div className="card flex flex-col items-start justify-between gap-4 border-gold/40 bg-gold/5 p-6 sm:flex-row sm:items-center">
        <div className="flex items-start gap-4">
          <span className="text-3xl">🎟️</span>
          <div>
            <h3 className="text-lg font-semibold">Zcash India on Luma</h3>
            <p className="mt-1 max-w-md text-sm text-muted">
              Every official event — with dates, locations and one-tap RSVP —
              lives on our Luma. Follow us there so you never miss the next one.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <ButtonLink href={profileUrl} external>
            RSVP on Luma
          </ButtonLink>
        </div>
      </div>

      {featured.length > 0 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {featured.map((ev) => (
            <div key={ev.id} className="card overflow-hidden">
              <iframe
                src={`https://lu.ma/embed/event/${ev.id}/simple`}
                title={ev.title ?? "Luma event"}
                className="h-[520px] w-full"
                style={{ border: "none" }}
                allow="fullscreen; payment"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
