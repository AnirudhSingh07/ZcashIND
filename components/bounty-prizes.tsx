import { site } from "@/config/site";
import { getBounty } from "@/lib/data";

export async function BountyPrizes() {
  const { prizes, prizePoolUsd } = await getBounty();
  return (
    <div className="card p-6">
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold">Prize pool</h3>
        <span className="text-2xl font-bold text-gold">${prizePoolUsd}</span>
      </div>
      <ul className="mt-4 divide-y divide-line">
        {prizes.map((p) => (
          <li
            key={p.place}
            className="flex items-center justify-between py-3 text-sm"
          >
            <div>
              <span className="font-medium text-text">{p.place}</span>
              <span className="ml-2 text-muted">{p.note}</span>
            </div>
            <span className="font-semibold text-gold">${p.amountUsd}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-muted/70">
        Paid in ZEC equivalent. {site.voice.impact} Social engagement is not the
        primary metric.
      </p>
    </div>
  );
}
