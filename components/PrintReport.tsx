// components/PrintReport.tsx
// 仅打印时可见的干净报表（白底黑字，方便存 PDF 发给别人）。
"use client";
import { formatLabel, Match, MARKETS } from "@/lib/types";
import { consistency, deviation } from "@/lib/odds";
import { marketPlatforms } from "@/lib/match";

const fmtPct = (x: number) => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(1)}%`;

function hasData(match: Match, key: string): boolean {
  const mo = match.odds[key];
  return !!mo && mo.values.some((row) => Object.values(row).some((v) => v !== null));
}

export function PrintReport({ match }: { match: Match }) {
  const markets = MARKETS.filter((m) => hasData(match, m.key));

  return (
    <div className="hidden bg-white p-6 text-black print:block">
      <h1 className="text-xl font-bold">{match.name || "赔率对比"}</h1>
      <p className="mt-1 text-sm text-gray-700">
        {match.sport} · {match.home || "主队"} vs {match.away || "客队"} ·{" "}
        {formatLabel(match.oddsFormat)} ·{" "}
        {new Date(match.updatedAt).toLocaleString("zh-CN")}
      </p>
      <p className="mt-0.5 text-xs text-gray-500">基准平台：bestxx（偏离度均相对它）</p>

      {markets.length === 0 && <p className="mt-4 text-sm">（暂无填写数据）</p>}

      {markets.map((m) => {
        const keys = m.outcomes.map((o) => o.key);
        const mo = match.odds[m.key];
        const priced = marketPlatforms(match, m.key);
        const dev = deviation(priced, keys, match.oddsFormat);
        const v = consistency(dev);
        return (
          <div key={m.key} className="mt-5 break-inside-avoid">
            <h2 className="text-base font-semibold">
              {m.name}
              {m.hasLine && mo.line ? `（盘口 ${mo.line}）` : ""}
              {v.hasData && (
                <span className="ml-2 text-sm font-normal">
                  {v.consistent
                    ? "✓ 与竞品一致"
                    : `⚠ 有偏差：${v.offenders.map((k) => m.outcomes.find((o) => o.key === k)?.label).join("、")}`}
                </span>
              )}
            </h2>
            <table className="mt-1 w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-gray-400 px-2 py-1 text-left">平台</th>
                  {m.outcomes.map((o) => (
                    <th key={o.key} className="border border-gray-400 px-2 py-1">
                      {o.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {match.platforms.map((p, i) => (
                  <tr key={i}>
                    <td className="border border-gray-400 px-2 py-1">
                      {p.name}
                      {p.isReference ? "（基准）" : ""}
                    </td>
                    {keys.map((k) => {
                      const val = mo.values[i]?.[k];
                      return (
                        <td key={k} className="border border-gray-400 px-2 py-1 text-center">
                          {val === null || val === undefined ? "—" : val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr>
                  <td className="border border-gray-400 px-2 py-1 font-medium">bestxx 偏离度</td>
                  {keys.map((k) => (
                    <td key={k} className="border border-gray-400 px-2 py-1 text-center">
                      {dev[k] ? fmtPct(dev[k]!.pct) : "—"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
