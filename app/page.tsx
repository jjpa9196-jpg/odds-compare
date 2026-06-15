// app/page.tsx
"use client";
import { useEffect, useState } from "react";
import { Match, MARKETS, marketDef, OddsFormat, Sport, SPORTS } from "@/lib/types";
import { loadMatches, saveMatches, newMatch } from "@/lib/storage";
import { setLine } from "@/lib/match";
import { MarketTabs } from "@/components/MarketTabs";
import { OddsTable } from "@/components/OddsTable";
import { ResultPanel } from "@/components/ResultPanel";

/** 旧版本 localStorage 数据结构不兼容时丢弃，避免崩溃 */
function isValidMatch(m: unknown): m is Match {
  const x = m as Match;
  return !!x && typeof x === "object" && !!x.odds && Array.isArray(x.platforms) && !!x.sport;
}

export default function Home() {
  const [match, setMatch] = useState<Match | null>(null);
  const [marketKey, setMarketKey] = useState<string>(MARKETS[0].key);

  useEffect(() => {
    const all = loadMatches();
    setMatch(isValidMatch(all[0]) ? all[0] : newMatch(crypto.randomUUID(), "新比赛"));
  }, []);

  useEffect(() => {
    if (match) saveMatches([match]);
  }, [match]);

  if (!match) return <main className="p-6 text-zinc-500">加载中…</main>;

  const def = marketDef(marketKey);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
      <header className="mb-5 space-y-3">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
          赔率对比 · bestxx 为基准
        </div>

        <div className="flex items-center gap-3">
          <input
            className="flex-1 border-b border-zinc-700 bg-transparent pb-1 text-xl font-semibold text-zinc-100 outline-none focus:border-amber-400"
            value={match.name}
            placeholder="比赛名称"
            onChange={(e) => setMatch({ ...match, name: e.target.value })}
          />
          <select
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-amber-400"
            value={match.oddsFormat}
            onChange={(e) => setMatch({ ...match, oddsFormat: e.target.value as OddsFormat })}
          >
            <option value="hk">香港盘</option>
            <option value="eu">欧赔</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <select
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-zinc-200 outline-none focus:border-amber-400"
            value={match.sport}
            onChange={(e) => setMatch({ ...match, sport: e.target.value as Sport })}
          >
            {SPORTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            className="w-28 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-zinc-200 outline-none focus:border-amber-400"
            value={match.home}
            placeholder="主队"
            onChange={(e) => setMatch({ ...match, home: e.target.value })}
          />
          <span className="text-zinc-600">vs</span>
          <input
            className="w-28 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-zinc-200 outline-none focus:border-amber-400"
            value={match.away}
            placeholder="客队"
            onChange={(e) => setMatch({ ...match, away: e.target.value })}
          />
        </div>
      </header>

      <div className="mb-3">
        <MarketTabs match={match} selected={marketKey} onSelect={setMarketKey} />
      </div>

      {def.hasLine && (
        <div className="mb-3 flex items-center gap-2 text-sm">
          <span className="text-zinc-400">盘口线</span>
          <input
            className="w-40 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-zinc-200 outline-none focus:border-amber-400"
            value={match.odds[marketKey].line}
            placeholder={def.linePlaceholder}
            onChange={(e) => setMatch(setLine(match, marketKey, e.target.value))}
          />
        </div>
      )}

      <OddsTable key={marketKey} match={match} marketKey={marketKey} onChange={setMatch} />
      <ResultPanel match={match} marketKey={marketKey} />

      <footer className="mt-8 text-center text-xs text-zinc-600">
        数据存于本机浏览器 · 实时计算，无需提交
      </footer>
    </main>
  );
}
