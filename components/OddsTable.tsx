// components/OddsTable.tsx
"use client";
import { useState } from "react";
import { Match, Outcome, OUTCOMES, Platform } from "@/lib/types";
import { toEuro } from "@/lib/odds";

const LABEL: Record<Outcome, string> = { "1": "主胜 1", X: "平局 X", "2": "客胜 2" };

export function OddsTable({
  match,
  onChange,
}: {
  match: Match;
  onChange: (platforms: Platform[]) => void;
}) {
  // 保留用户正在输入的原文（key=`${idx}:${o}`），让 "2." / "2.1" 这类小数能正常输入，
  // 不会被即时 Number() 转换吃掉小数点。
  const [draft, setDraft] = useState<Record<string, string>>({});

  function cellText(idx: number, p: Platform, o: Outcome): string {
    const k = `${idx}:${o}`;
    if (k in draft) return draft[k];
    return p.odds[o] === null ? "" : String(p.odds[o]);
  }

  function setOdds(idx: number, o: Outcome, raw: string) {
    setDraft((d) => ({ ...d, [`${idx}:${o}`]: raw }));
    const trimmed = raw.trim();
    const n = trimmed === "" ? null : Number(trimmed);
    const v = n !== null && Number.isFinite(n) ? n : null;
    onChange(
      match.platforms.map((p, i) =>
        i === idx ? { ...p, odds: { ...p.odds, [o]: v } } : p
      )
    );
  }
  function setName(idx: number, name: string) {
    onChange(match.platforms.map((p, i) => (i === idx ? { ...p, name } : p)));
  }
  function addRow() {
    setDraft({});
    onChange([
      ...match.platforms,
      { name: "新平台", odds: { "1": null, X: null, "2": null } },
    ]);
  }
  function removeRow(idx: number) {
    setDraft({});
    onChange(match.platforms.filter((_, i) => i !== idx));
  }

  const hint = match.oddsFormat === "hk" ? "香港盘需 > 0" : "欧赔需 > 1";

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-zinc-900 text-xs uppercase tracking-wide text-zinc-400">
              <th className="px-3 py-2.5 text-left font-medium">平台</th>
              {OUTCOMES.map((o) => (
                <th key={o} className="px-3 py-2.5 text-center font-medium">
                  {LABEL[o]}
                </th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {match.platforms.map((p, idx) => (
              <tr
                key={idx}
                className={`border-t border-zinc-800 ${
                  p.isReference ? "bg-amber-400/10" : ""
                }`}
              >
                <td
                  className={`px-3 py-2 ${
                    p.isReference ? "border-l-2 border-amber-400" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      className="w-24 rounded bg-transparent px-1 py-1 text-zinc-100 outline-none focus:bg-zinc-800"
                      value={p.name}
                      onChange={(e) => setName(idx, e.target.value)}
                    />
                    {p.isReference && (
                      <span className="shrink-0 rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                        基准
                      </span>
                    )}
                  </div>
                </td>
                {OUTCOMES.map((o) => {
                  const text = cellText(idx, p, o);
                  const invalid =
                    text.trim() !== "" && toEuro(p.odds[o], match.oddsFormat) === null;
                  return (
                    <td key={o} className="px-2 py-2 text-center">
                      <input
                        inputMode="decimal"
                        placeholder="—"
                        className={`w-16 rounded border bg-zinc-800/60 px-2 py-1.5 text-center tabular-nums text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-amber-400/70 focus:bg-zinc-800 ${
                          invalid ? "border-rose-500/70" : "border-transparent"
                        }`}
                        value={text}
                        onChange={(e) => setOdds(idx, o, e.target.value)}
                      />
                    </td>
                  );
                })}
                <td className="px-2 text-center">
                  {!p.isReference && (
                    <button
                      onClick={() => removeRow(idx)}
                      className="text-zinc-500 transition-colors hover:text-rose-400"
                      aria-label="删除平台"
                    >
                      ×
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
        <button
          onClick={addRow}
          className="rounded px-2 py-1 text-sky-400 transition-colors hover:bg-sky-400/10"
        >
          + 加平台
        </button>
        <span>实时计算 · {hint}（红框=无效值）</span>
      </div>
    </div>
  );
}
