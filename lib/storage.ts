// lib/storage.ts
import { Match, MARKETS, MarketOdds, PlatformMeta } from "./types";

const KEY = "odds-compare:matches";

/** 默认 4 个平台：bestxx 基准 + 三家竞品（对应给定网址） */
export function defaultPlatforms(): PlatformMeta[] {
  return [
    { name: "bestxx", isReference: true },
    { name: "bc.game" },
    { name: "qzino" },
  ];
}

function emptyValues(outcomeKeys: string[]): Record<string, number | null> {
  const v: Record<string, number | null> = {};
  for (const k of outcomeKeys) v[k] = null;
  return v;
}

/** 为所有玩法建空赔率表（每个平台一行空值） */
export function emptyOdds(platformCount: number): Record<string, MarketOdds> {
  const odds: Record<string, MarketOdds> = {};
  for (const m of MARKETS) {
    const keys = m.outcomes.map((o) => o.key);
    odds[m.key] = {
      line: "",
      values: Array.from({ length: platformCount }, () => emptyValues(keys)),
    };
  }
  return odds;
}

/** 生成一场空比赛（id、当前时间戳由调用方传入，避免在纯逻辑里用 Date） */
export function newMatch(id: string, now: number, name = "新比赛"): Match {
  const platforms = defaultPlatforms();
  return {
    id,
    name,
    home: "",
    away: "",
    sport: "足球",
    oddsFormat: "hk",
    platforms,
    odds: emptyOdds(platforms.length),
    createdAt: now,
    updatedAt: now,
  };
}

/** 判断 localStorage 里的记录是否是当前数据结构（旧版直接丢弃，避免崩溃） */
export function isValidMatch(m: unknown): m is Match {
  const x = m as Match;
  return (
    !!x &&
    typeof x === "object" &&
    typeof x.id === "string" &&
    !!x.odds &&
    Array.isArray(x.platforms) &&
    !!x.sport &&
    typeof x.updatedAt === "number"
  );
}

export function loadMatches(): Match[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as unknown[]) : [];
    return Array.isArray(arr) ? arr.filter(isValidMatch) : [];
  } catch {
    return [];
  }
}

export function saveMatches(matches: Match[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(matches));
}
