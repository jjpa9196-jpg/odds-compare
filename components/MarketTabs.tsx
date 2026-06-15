// components/MarketTabs.tsx
"use client";
import { Match, MARKETS } from "@/lib/types";
import { consistency, deviation } from "@/lib/odds";
import { marketPlatforms } from "@/lib/match";

function dotClass(match: Match, marketKey: string): string {
  const def = MARKETS.find((m) => m.key === marketKey)!;
  const keys = def.outcomes.map((o) => o.key);
  const v = consistency(deviation(marketPlatforms(match, marketKey), keys, match.oddsFormat));
  if (!v.hasData) return "bg-zinc-600"; // 无数据
  return v.consistent ? "bg-emerald-400" : "bg-amber-400"; // 一致 / 有偏差
}

export function MarketTabs({
  match,
  selected,
  onSelect,
}: {
  match: Match;
  selected: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {MARKETS.map((m) => {
        const active = m.key === selected;
        return (
          <button
            key={m.key}
            onClick={() => onSelect(m.key)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              active
                ? "border-amber-400/60 bg-amber-400/10 text-zinc-100"
                : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${dotClass(match, m.key)}`} />
            {m.name}
          </button>
        );
      })}
    </div>
  );
}
