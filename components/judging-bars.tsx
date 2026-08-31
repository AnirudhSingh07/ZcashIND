import { site } from "@/config/site";

export function JudgingBars() {
  const bars = site.bounty.judging;
  const max = Math.max(...bars.map((b) => b.weight));
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold">How meetups are judged</h3>
      <p className="mt-1 text-sm text-muted">
        Out of 100. {site.voice.impact}
      </p>
      <div className="mt-5 space-y-4">
        {bars.map((b) => (
          <div key={b.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-text">{b.label}</span>
              <span className="tabular-nums text-muted">{b.weight}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-gold"
                style={{ width: `${(b.weight / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
