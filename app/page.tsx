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

  if (!match) return <main className="p-6">加载中…</main>;

  const setPlatforms = (platforms: Platform[]) => setMatch({ ...match, platforms });
  const setFormat = (oddsFormat: OddsFormat) => setMatch({ ...match, oddsFormat });

  return (
    <main className="mx-auto max-w-2xl p-4">
      <div className="mb-4 flex items-center gap-3">
        <input
          className="flex-1 border-b text-lg outline-none"
          value={match.name}
          onChange={(e) => setMatch({ ...match, name: e.target.value })}
        />
        <select
          className="border rounded p-1"
          value={match.oddsFormat}
          onChange={(e) => setFormat(e.target.value as OddsFormat)}
        >
          <option value="hk">香港盘</option>
          <option value="eu">欧赔</option>
        </select>
      </div>
      <OddsTable match={match} onChange={setPlatforms} />
      <ResultPanel match={match} />
    </main>
  );
}
