// components/OddsTable.tsx
"use client";
import { useState } from "react";
import { formatHint, Match, marketDef } from "@/lib/types";
import { toEuro } from "@/lib/odds";
import { addPlatform, removePlatform, renamePlatform, setOdd } from "@/lib/match";

export function OddsTable({
  match,
  marketKey,
  onChange,
}: {
  match: Match;
  marketKey: string;
  onChange: (next: Match) => void;
}) {
  const def = marketDef(marketKey);
  const values = match.odds[marketKey]?.values ?? [];
  // 保留正在输入的原文，让 "2." / "2.10" 这类小数能输进去（不被即时 Number() 吃掉小数点）
  const [draft, setDraft] = useState<Record<string, string>>({});

  function cellText(idx: number, key: string): string {
    const k = `${idx}:${key}`;
    if (k in draft) return draft[k];
    const v = values[idx]?.[key];
    return v === null || v === undefined ? "" : String(v);
  }

  function onCell(idx: number, key: string, raw: string) {
    setDraft((d) => ({ ...d, [`${idx}:${key}`]: raw }));
    const t = raw.trim();
    const n = t === "" ? null : Number(t);
    const v = n !== null && Number.isFinite(n) ? n : null;
    onChange(setOdd(match, marketKey, idx, key, v));
  }

  const hint = formatHint(match.oddsFormat);

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-zinc-900 text-xs uppercase tracking-wide text-zinc-400">
              <th className="px-3 py-2.5 text-left font-medium">平台</th>
              {def.outcomes.map((o) => (
                <th key={o.key} className="px-3 py-2.5 text-center font-medium">
                  {o.label}
                </th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {match.platforms.map((p, idx) => (
              <tr
                key={idx}
                className={`border-t border-zinc-800 ${p.isReference ? "bg-amber-400/10" : ""}`}
              >
                <td className={`px-3 py-2 ${p.isReference ? "border-l-2 border-amber-400" : ""}`}>
                  <div className="flex items-center gap-2">
                    <input
                      className="w-24 rounded bg-transparent px-1 py-1 text-zinc-100 outline-none focus:bg-zinc-800"
                      value={p.name}
                      onChange={(e) => onChange(renamePlatform(match, idx, e.target.value))}
                    />
                    {p.isReference && (
                      <span className="shrink-0 rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                        基准
                      </span>
                    )}
                  </div>
                </td>
                {def.outcomes.map((o) => {
                  const text = cellText(idx, o.key);
                  const invalid =
                    text.trim() !== "" &&
                    toEuro(values[idx]?.[o.key] ?? null, match.oddsFormat) === null;
                  return (
                    <td key={o.key} className="px-2 py-2 text-center">
                      <input
                        inputMode="decimal"
                        placeholder="—"
                        className={`w-16 rounded border bg-zinc-800/60 px-2 py-1.5 text-center tabular-nums text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-amber-400/70 focus:bg-zinc-800 ${
                          invalid ? "border-rose-500/70" : "border-transparent"
                        }`}
                        value={text}
                        onChange={(e) => onCell(idx, o.key, e.target.value)}
                      />
                    </td>
                  );
                })}
                <td className="px-2 text-center">
                  {!p.isReference && (
                    <button
                      onClick={() => {
                        setDraft({});
                        onChange(removePlatform(match, idx));
                      }}
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
          onClick={() => {
            setDraft({});
            onChange(addPlatform(match));
          }}
          className="rounded px-2 py-1 text-sky-400 transition-colors hover:bg-sky-400/10"
        >
          + 加平台
        </button>
        <span>实时计算 · {hint}（红框=无效值）</span>
      </div>
    </div>
  );
}
