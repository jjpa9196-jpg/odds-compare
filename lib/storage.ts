// lib/storage.ts
import { Match, Platform } from "./types";

const KEY = "odds-compare:matches";

/** 默认 4 个平台：bestxx 基准 + 三家竞品（对应给定网址） */
export function defaultPlatforms(): Platform[] {
  const empty = () => ({ "1": null, X: null, "2": null });
  return [
    { name: "bestxx", isReference: true, odds: empty() },
    { name: "bc.game", odds: empty() },
    { name: "qzino", odds: empty() },
    { name: "188bet", odds: empty() },
  ];
}

/** 生成一场空比赛（id 由调用方传入） */
export function newMatch(id: string, name = "新比赛"): Match {
  return { id, name, oddsFormat: "hk", platforms: defaultPlatforms() };
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
