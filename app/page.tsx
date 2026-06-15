// app/page.tsx
"use client";
import { useEffect, useState } from "react";
import { Match, MARKETS, marketDef, OddsFormat, ODDS_FORMATS, Sport, SPORTS } from "@/lib/types";
import { loadMatches, saveMatches, newMatch } from "@/lib/storage";
import { setLine } from "@/lib/match";
import { matchToCsv, downloadText } from "@/lib/exportCsv";
import { MarketTabs } from "@/components/MarketTabs";
import { OddsTable } from "@/components/OddsTable";
import { ResultPanel } from "@/components/ResultPanel";
import { HistoryPanel } from "@/components/HistoryPanel";
import { PrintReport } from "@/components/PrintReport";

const now = () => Date.now();
const uuid = () => crypto.randomUUID();

export default function Home() {
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [currentId, setCurrentId] = useState<string>("");
  const [marketKey, setMarketKey] = useState<string>(MARKETS[0].key);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const all = loadMatches();
    if (all.length > 0) {
      const latest = [...all].sort((a, b) => b.updatedAt - a.updatedAt)[0];
      setMatches(all);
      setCurrentId(latest.id);
    } else {
      const m = newMatch(uuid(), now());
      setMatches([m]);
      setCurrentId(m.id);
    }
  }, []);

  useEffect(() => {
    if (matches) saveMatches(matches);
  }, [matches]);

  if (!matches) return <main className="p-6 text-zinc-500">加载中…</main>;
  const current = matches.find((m) => m.id === currentId);
  if (!current) return <main className="p-6 text-zinc-500">加载中…</main>;

  const def = marketDef(marketKey);

  const update = (next: Match) =>
    setMatches((prev) =>
      (prev ?? []).map((m) => (m.id === currentId ? { ...next, updatedAt: now() } : m))
    );

  const createNew = () => {
    const m = newMatch(uuid(), now());
    setMatches((prev) => [m, ...(prev ?? [])]);
    setCurrentId(m.id);
    setMarketKey(MARKETS[0].key);
    setShowHistory(false);
  };

  const remove = (id: string) => {
    let rest = matches.filter((m) => m.id !== id);
    if (rest.length === 0) rest = [newMatch(uuid(), now())];
    setMatches(rest);
    if (id === currentId) {
      setCurrentId([...rest].sort((a, b) => b.updatedAt - a.updatedAt)[0].id);
    }
  };

  const exportCsv = () => {
    const name = (current.name && current.name !== "新比赛" ? current.name : "赔率对比").replace(
      /[\\/:*?"<>|]/g,
      "_"
    );
    downloadText(`${name}.csv`, matchToCsv(current), "text/csv");
  };

  return (
    <>
      <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10 print:hidden">
        {/* 工具条 */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800"
          >
            历史 {showHistory ? "▲" : "▼"}
          </button>
          <button
            onClick={createNew}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800"
          >
            + 新建
          </button>
          <div className="ml-auto flex gap-2">
            <button
              onClick={exportCsv}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800"
            >
              导出 CSV
            </button>
            <button
              onClick={() => window.print()}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800"
            >
              导出 PDF
            </button>
          </div>
        </div>

        {showHistory && (
          <div className="mb-4">
            <HistoryPanel
              matches={matches}
              currentId={currentId}
              onSelect={(id) => {
                setCurrentId(id);
                setMarketKey(MARKETS[0].key);
                setShowHistory(false);
              }}
              onDelete={remove}
            />
          </div>
        )}

        <header className="mb-5 space-y-3">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            赔率对比 · bestxx 为基准
          </div>

          <div className="flex items-center gap-3">
            <input
              className="flex-1 border-b border-zinc-700 bg-transparent pb-1 text-xl font-semibold text-zinc-100 outline-none focus:border-amber-400"
              value={current.name}
              placeholder="比赛名称"
              onChange={(e) => update({ ...current, name: e.target.value })}
            />
            <select
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-amber-400"
              value={current.oddsFormat}
              onChange={(e) => update({ ...current, oddsFormat: e.target.value as OddsFormat })}
            >
              {ODDS_FORMATS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <select
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-zinc-200 outline-none focus:border-amber-400"
              value={current.sport}
              onChange={(e) => update({ ...current, sport: e.target.value as Sport })}
            >
              {SPORTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              className="w-28 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-zinc-200 outline-none focus:border-amber-400"
              value={current.home}
              placeholder="主队"
              onChange={(e) => update({ ...current, home: e.target.value })}
            />
            <span className="text-zinc-600">vs</span>
            <input
              className="w-28 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-zinc-200 outline-none focus:border-amber-400"
              value={current.away}
              placeholder="客队"
              onChange={(e) => update({ ...current, away: e.target.value })}
            />
          </div>
        </header>

        <div className="mb-3">
          <MarketTabs match={current} selected={marketKey} onSelect={setMarketKey} />
        </div>

        {def.hasLine && (
          <div className="mb-3 flex items-center gap-2 text-sm">
            <span className="text-zinc-400">盘口线</span>
            <input
              className="w-40 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-zinc-200 outline-none focus:border-amber-400"
              value={current.odds[marketKey].line}
              placeholder={def.linePlaceholder}
              onChange={(e) => update(setLine(current, marketKey, e.target.value))}
            />
          </div>
        )}

        <OddsTable key={marketKey} match={current} marketKey={marketKey} onChange={update} />
        <ResultPanel match={current} marketKey={marketKey} />

        <footer className="mt-8 text-center text-xs text-zinc-600">
          数据存于本机浏览器 · 实时计算，无需提交
        </footer>
      </main>

      {/* 仅打印可见：干净报表 → 浏览器“另存为 PDF” */}
      <PrintReport match={current} />
    </>
  );
}
