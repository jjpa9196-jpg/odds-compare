// lib/odds.ts
import { OddsFormat, PricedPlatform } from "./types";

/** 把用户填的原始赔率按格式转成欧赔；null/非法返回 null */
export function toEuro(value: number | null, format: OddsFormat): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  switch (format) {
    case "eu": // 欧赔（小数）
      return value > 1 ? value : null;
    case "hk": // 香港盘：欧赔 = 港赔 + 1
      return value > 0 ? value + 1 : null;
    case "id": // 印尼盘：|值| ≥ 1，正=港赔，负=1-1/值
      if (value >= 1) return value + 1;
      if (value <= -1) return 1 - 1 / value;
      return null;
    case "my": // 马来盘：-1~1（不含0），正=港赔，负=1-1/值
      if (value > 0 && value <= 1) return value + 1;
      if (value < 0 && value >= -1) return 1 - 1 / value;
      return null;
    default:
      return null;
  }
}

/** 隐含概率 = 1/欧赔；欧赔需 > 0 */
export function impliedProb(euroOdds: number | null): number | null {
  if (euroOdds === null || !Number.isFinite(euroOdds) || euroOdds <= 0) return null;
  return 1 / euroOdds;
}

/** 单家水位：各结果欧赔 ∑(1/d) - 1；任一缺失返回 null */
export function overround(euros: (number | null)[]): number | null {
  if (euros.length === 0 || euros.some((d) => d === null || (d as number) <= 0)) return null;
  const sum = euros.reduce<number>((acc, d) => acc + 1 / (d as number), 0);
  return sum - 1;
}

/** 去水后的公平概率（归一化），顺序同输入；任一缺失返回 null */
export function fairProbs(euros: (number | null)[]): number[] | null {
  if (euros.length === 0 || euros.some((d) => d === null || (d as number) <= 0)) return null;
  const inv = euros.map((d) => 1 / (d as number));
  const sum = inv.reduce((a, b) => a + b, 0);
  return inv.map((x) => x / sum);
}

export interface BestPick {
  euro: number;
  platform: string;
}

/** 每个结果跨平台挑最高欧赔；outcomeKeys 指定该玩法的结果集 */
export function bestByOutcome(
  platforms: Pick<PricedPlatform, "name" | "odds">[],
  outcomeKeys: string[],
  format: OddsFormat
): Record<string, BestPick | null> {
  const result: Record<string, BestPick | null> = {};
  for (const o of outcomeKeys) {
    let best: BestPick | null = null;
    for (const p of platforms) {
      const euro = toEuro(p.odds[o] ?? null, format);
      if (euro !== null && (best === null || euro > best.euro)) {
        best = { euro, platform: p.name };
      }
    }
    result[o] = best;
  }
  return result;
}

export interface ArbResult {
  sum: number | null;
  hasArb: boolean;
  profitRate: number | null;
  stakes: Record<string, number> | null;
}

/** 用每个结果各自的最优家算套利（仅对互斥且穷尽的玩法有意义） */
export function arbitrage(
  platforms: Pick<PricedPlatform, "name" | "odds">[],
  outcomeKeys: string[],
  format: OddsFormat
): ArbResult {
  const best = bestByOutcome(platforms, outcomeKeys, format);
  if (outcomeKeys.length === 0 || outcomeKeys.some((o) => best[o] === null)) {
    return { sum: null, hasArb: false, profitRate: null, stakes: null };
  }
  const inv: Record<string, number> = {};
  let sum = 0;
  for (const o of outcomeKeys) {
    const v = 1 / best[o]!.euro;
    inv[o] = v;
    sum += v;
  }
  const stakes: Record<string, number> = {};
  for (const o of outcomeKeys) stakes[o] = inv[o] / sum;
  return { sum, hasArb: sum < 1, profitRate: 1 / sum - 1, stakes };
}

export type DeviationFlag = "high" | "low" | "ok";
export interface DeviationItem {
  refEuro: number;
  compMean: number;
  pct: number; // refEuro/compMean - 1
  flag: DeviationFlag;
}

/** bestxx 相对竞品均值的偏离度；threshold 默认 0.03 */
export function deviation(
  platforms: Pick<PricedPlatform, "name" | "isReference" | "odds">[],
  outcomeKeys: string[],
  format: OddsFormat,
  threshold = 0.03
): Record<string, DeviationItem | null> {
  const ref = platforms.find((p) => p.isReference);
  const comps = platforms.filter((p) => !p.isReference);
  const result: Record<string, DeviationItem | null> = {};
  for (const o of outcomeKeys) {
    const refEuro = ref ? toEuro(ref.odds[o] ?? null, format) : null;
    const compEuros = comps
      .map((p) => toEuro(p.odds[o] ?? null, format))
      .filter((v): v is number => v !== null);
    if (refEuro === null || compEuros.length === 0) {
      result[o] = null;
      continue;
    }
    const compMean = compEuros.reduce((a, b) => a + b, 0) / compEuros.length;
    const pct = refEuro / compMean - 1;
    const flag: DeviationFlag =
      pct > threshold ? "high" : pct < -threshold ? "low" : "ok";
    result[o] = { refEuro, compMean, pct, flag };
  }
  return result;
}

export interface Consistency {
  hasData: boolean; // 是否有可比的结果
  consistent: boolean; // 全部在阈值内
  offenders: string[]; // 偏离超阈值的结果 key
}

/** 把某玩法的偏离结果汇总成"是否一致"的结论 */
export function consistency(
  dev: Record<string, DeviationItem | null>
): Consistency {
  const items = Object.entries(dev).filter(
    (e): e is [string, DeviationItem] => e[1] !== null
  );
  if (items.length === 0) return { hasData: false, consistent: false, offenders: [] };
  const offenders = items.filter(([, v]) => v.flag !== "ok").map(([k]) => k);
  return { hasData: true, consistent: offenders.length === 0, offenders };
}
