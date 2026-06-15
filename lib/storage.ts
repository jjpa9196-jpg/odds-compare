// lib/storage.ts
import { Match, MARKETS, MarketOdds, PlatformMeta } from "./types";

const KEY = "odds-compare:matches";

/** 默认 4 个平台：bestxx 基准 + 三家竞品（对应给定网址） */
export function defaultPlatforms(): PlatformMeta[] {
  return [
    { name: "bestxx", isReference: true },
    { name: "bc.game" },
    { name: "qzino" },
    { name: "188bet" },
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

/** 生成一场空比赛（id 由调用方传入） */
export function newMatch(id: string, name = "新比赛"): Match {
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
  };
}

export function loadMatches(): Match[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Match[]) : [];
  } catch {
    return [];
  }
}

export function saveMatches(matches: Match[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(matches));
}
