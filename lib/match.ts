// lib/match.ts
// 纯函数：操作 Match 状态 + 把"全局平台 + 某玩法赔率"合成给计算层用。
import { Match, MARKETS, marketDef, PricedPlatform } from "./types";

/** 合成某玩法下的"带赔率平台"数组，供 lib/odds 计算 */
export function marketPlatforms(match: Match, marketKey: string): PricedPlatform[] {
  const mo = match.odds[marketKey];
  return match.platforms.map((p, i) => ({
    name: p.name,
    isReference: p.isReference,
    odds: mo?.values[i] ?? {},
  }));
}

function cloneOdds(match: Match) {
  // 浅拷贝到改动所需的深度
  const odds: Match["odds"] = {};
  for (const [k, v] of Object.entries(match.odds)) {
    odds[k] = { line: v.line, values: v.values.map((row) => ({ ...row })) };
  }
  return odds;
}

export function setOdd(
  match: Match,
  marketKey: string,
  platformIdx: number,
  outcomeKey: string,
  value: number | null
): Match {
  const odds = cloneOdds(match);
  odds[marketKey].values[platformIdx][outcomeKey] = value;
  return { ...match, odds };
}

export function setLine(match: Match, marketKey: string, line: string): Match {
  const odds = cloneOdds(match);
  odds[marketKey].line = line;
  return { ...match, odds };
}

export function renamePlatform(match: Match, idx: number, name: string): Match {
  const platforms = match.platforms.map((p, i) => (i === idx ? { ...p, name } : p));
  return { ...match, platforms };
}

export function addPlatform(match: Match, name = "新平台"): Match {
  const platforms = [...match.platforms, { name }];
  const odds = cloneOdds(match);
  for (const m of MARKETS) {
    const keys = marketDef(m.key).outcomes.map((o) => o.key);
    const row: Record<string, number | null> = {};
    for (const k of keys) row[k] = null;
    odds[m.key].values.push(row);
  }
  return { ...match, platforms, odds };
}

export function removePlatform(match: Match, idx: number): Match {
  const platforms = match.platforms.filter((_, i) => i !== idx);
  const odds = cloneOdds(match);
  for (const k of Object.keys(odds)) {
    odds[k].values = odds[k].values.filter((_, i) => i !== idx);
  }
  return { ...match, platforms, odds };
}
