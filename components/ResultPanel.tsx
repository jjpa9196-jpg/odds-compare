// components/ResultPanel.tsx
"use client";
import { Match, Outcome, OUTCOMES } from "@/lib/types";
import { arbitrage, bestByOutcome, deviation, overround, toEuro } from "@/lib/odds";

const LABEL: Record<Outcome, string> = { "1": "主胜", X: "平局", "2": "客胜" };
const pct = (x: number) => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(1)}%`;

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-200">{title}</h2>
      {children}
    </section>
  );
}

export function ResultPanel({ match }: { match: Match }) {
  const fmt = match.oddsFormat;
  const dev = deviation(match.platforms, fmt);
  const best = bestByOutcome(match.platforms, fmt);
  const arb = arbitrage(match.platforms, fmt);

  return (
    <div className="mt-6 space-y-3 text-sm">
      <Card title="bestxx 偏离度（vs 竞品均值）">
        <div className="grid grid-cols-3 gap-3">
          {OUTCOMES.map((o) => {
            const d = dev[o];
            if (!d)
              return (
                <div key={o} className="rounded-lg bg-zinc-800/40 px-3 py-2.5">
                  <div className="text-xs text-zinc-500">{LABEL[o]}</div>
                  <div className="text-zinc-600">无对比</div>
                </div>
              );
            const tone =
              d.flag === "high"
                ? "text-sky-400"
                : d.flag === "low"
                ? "text-rose-400"
                : "text-zinc-300";
            const tag = d.flag === "high" ? "偏高" : d.flag === "low" ? "偏低" : "一致";
            return (
              <div key={o} className="rounded-lg bg-zinc-800/40 px-3 py-2.5">
                <div className="text-xs text-zinc-500">{LABEL[o]}</div>
                <div className={`text-lg font-semibold tabular-nums ${tone}`}>
                  {pct(d.pct)}
                </div>
                <div className={`text-xs ${tone}`}>{tag}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="每结果最优家">
        <div className="grid grid-cols-3 gap-3">
          {OUTCOMES.map((o) => (
            <div key={o} className="rounded-lg bg-zinc-800/40 px-3 py-2.5">
              <div className="text-xs text-zinc-500">{LABEL[o]}</div>
              {best[o] ? (
                <div>
                  <span className="font-medium text-emerald-400">{best[o]!.platform}</span>
                  <span className="ml-1 tabular-nums text-zinc-400">
                    {best[o]!.euro.toFixed(2)}
                  </span>
                </div>
              ) : (
                <div className="text-zinc-600">—</div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card title="各家水位（overround，越低越划算）">
        <ul className="space-y-1.5">
          {match.platforms.map((p, i) => {
            const or = overround(OUTCOMES.map((o) => toEuro(p.odds[o], fmt)));
            return (
              <li key={i} className="flex items-center justify-between">
                <span className="text-zinc-400">{p.name}</span>
                <span className="tabular-nums text-zinc-200">
                  {or === null ? "—" : `${(or * 100).toFixed(1)}%`}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title="套利率（次要参考）">
        {arb.sum === null ? (
          <p className="text-zinc-600">信息不全</p>
        ) : arb.hasArb ? (
          <div className="space-y-1">
            <p className="font-medium text-emerald-400">
              有套利 · 保证利润 {pct(arb.profitRate!)}
            </p>
            <p className="text-xs text-zinc-400">
              ∑(1/最优) = {arb.sum.toFixed(4)} ·{" "}
              {OUTCOMES.map((o) => `${LABEL[o]} ${(arb.stakes![o] * 100).toFixed(1)}%`).join(
                " / "
              )}
            </p>
          </div>
        ) : (
          <p className="text-zinc-400">
            无套利 · ∑(1/最优) = <span className="tabular-nums">{arb.sum.toFixed(4)}</span>
          </p>
        )}
      </Card>
    </div>
  );
}
