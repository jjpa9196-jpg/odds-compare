// app/page.tsx
"use client";
import { useEffect, useState } from "react";
import { Match, OddsFormat, Platform } from "@/lib/types";
import { loadMatches, saveMatches, newMatch } from "@/lib/storage";
import { OddsTable } from "@/components/OddsTable";
import { ResultPanel } from "@/components/ResultPanel";

export default function Home() {
  const [match, setMatch] = useState<Match | null>(null);

  useEffect(() => {
    const all = loadMatches();
    if (all.length > 0) {
      setMatch(all[0]);
    } else {
      setMatch(newMatch(crypto.randomUUID(), "新比赛"));
    }
  }, []);

  useEffect(() => {
    if (match) saveMatches([match]);
  }, [match]);

  if (!match) return <main className="p-6 text-zinc-500">加载中…</main>;

  const setPlatforms = (platforms: Platform[]) => setMatch({ ...match, platforms });
  const setFormat = (oddsFormat: OddsFormat) => setMatch({ ...match, oddsFormat });

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
      <header className="mb-5">
        <div className="mb-3 flex items-center gap-2 text-xs text-zinc-500">
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
            onChange={(e) => setFormat(e.target.value as OddsFormat)}
          >
            <option value="hk">香港盘</option>
            <option value="eu">欧赔</option>
          </select>
        </div>
      </header>

      <OddsTable match={match} onChange={setPlatforms} />
      <ResultPanel match={match} />

      <footer className="mt-8 text-center text-xs text-zinc-600">
        数据存于本机浏览器 · 实时计算，无需提交
      </footer>
    </main>
  );
}
