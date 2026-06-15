// components/ResultPanel.tsx
"use client";
import { Match, Outcome, OUTCOMES } from "@/lib/types";
import { arbitrage, bestByOutcome, deviation, overround, toEuro } from "@/lib/odds";

const LABEL: Record<Outcome, string> = { "1": "主胜", X: "平局", "2": "客胜" };
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

export function ResultPanel({ match }: { match: Match }) {
  const fmt = match.oddsFormat;
  const dev = deviation(match.platforms, fmt);
  const best = bestByOutcome(match.platforms, fmt);
  const arb = arbitrage(match.platforms, fmt);

  return (
    <div className="mt-6 space-y-4 text-sm">
      <section className="rounded border p-3">
        <h2 className="font-semibold mb-2">bestxx 偏离度（vs 竞品均值）</h2>
        <div className="grid grid-cols-3 gap-2">
          {OUTCOMES.map((o) => {
            const d = dev[o];
            if (!d) return <div key={o} className="text-gray-400">{LABEL[o]}：无对比</div>;
            const color =
              d.flag === "high" ? "text-blue-600" : d.flag === "low" ? "text-red-600" : "text-gray-700";
            const tag = d.flag === "high" ? "偏高" : d.flag === "low" ? "偏低" : "一致";
            return (
              <div key={o} className={color}>
                {LABEL[o]}：{pct(d.pct)} <span className="text-xs">({tag})</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded border p-3">
        <h2 className="font-semibold mb-2">每结果最优家</h2>
        <div className="grid grid-cols-3 gap-2">
          {OUTCOMES.map((o) => (
            <div key={o}>
              {LABEL[o]}：{best[o] ? `${best[o]!.platform} (${best[o]!.euro.toFixed(2)})` : "—"}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded border p-3">
        <h2 className="font-semibold mb-2">各家水位（overround）</h2>
        <ul>
          {match.platforms.map((p, i) => {
            const or = overround(OUTCOMES.map((o) => toEuro(p.odds[o], fmt)));
            return (
              <li key={i}>
                {p.name}：{or === null ? "—" : pct(or)}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded border p-3">
        <h2 className="font-semibold mb-2">套利率（次要参考）</h2>
        {arb.sum === null ? (
          <p className="text-gray-400">信息不全</p>
        ) : arb.hasArb ? (
          <p className="text-green-600">
            有套利：∑={arb.sum.toFixed(4)}，保证利润 {pct(arb.profitRate!)}；下注比例{" "}
            {OUTCOMES.map((o) => `${LABEL[o]} ${pct(arb.stakes![o])}`).join(" / ")}
          </p>
        ) : (
          <p>无套利：∑={arb.sum.toFixed(4)}</p>
        )}
      </section>
    </div>
  );
}
