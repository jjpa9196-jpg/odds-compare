import { Outcome, OUTCOMES, OddsFormat, Platform } from "./types";

/** 把用户填的原始赔率按格式转成欧赔；null/非法返回 null */
export function toEuro(value: number | null, format: OddsFormat): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  if (format === "hk") {
    return value > 0 ? value + 1 : null;
  }
  return value > 1 ? value : null;
}

/** 隐含概率 = 1/欧赔；欧赔需 > 0 */
export function impliedProb(euroOdds: number | null): number | null {
  if (euroOdds === null || !Number.isFinite(euroOdds) || euroOdds <= 0) return null;
  return 1 / euroOdds;
}

/** 单家水位：三个欧赔 ∑(1/d) - 1；任一缺失返回 null */
export function overround(euros: (number | null)[]): number | null {
  if (euros.some((d) => d === null || (d as number) <= 0)) return null;
  const sum = euros.reduce<number>((acc, d) => acc + 1 / (d as number), 0);
  return sum - 1;
}

/** 去水后的公平概率（归一化），顺序同输入；任一缺失返回 null */
export function fairProbs(euros: (number | null)[]): number[] | null {
  if (euros.some((d) => d === null || (d as number) <= 0)) return null;
  const inv = euros.map((d) => 1 / (d as number));
  const sum = inv.reduce((a, b) => a + b, 0);
  return inv.map((x) => x / sum);
}

export interface BestPick {
  euro: number;
  platform: string;
}
export type BestByOutcome = Record<Outcome, BestPick | null>;

/** 每个结果跨平台挑最高欧赔 */
export function bestByOutcome(
  platforms: Pick<Platform, "name" | "odds">[],
  format: OddsFormat
): BestByOutcome {
  const result = {} as BestByOutcome;
  for (const o of OUTCOMES) {
    let best: BestPick | null = null;
    for (const p of platforms) {
      const euro = toEuro(p.odds[o], format);
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
  stakes: Record<Outcome, number> | null;
}

/** 用每个结果各自的最优家算套利 */
export function arbitrage(
  platforms: Pick<Platform, "name" | "odds">[],
  format: OddsFormat
): ArbResult {
  const best = bestByOutcome(platforms, format);
  if (OUTCOMES.some((o) => best[o] === null)) {
    return { sum: null, hasArb: false, profitRate: null, stakes: null };
  }
  const inv: Record<Outcome, number> = { "1": 0, X: 0, "2": 0 };
  let sum = 0;
  for (const o of OUTCOMES) {
    const v = 1 / best[o]!.euro;
    inv[o] = v;
    sum += v;
  }
  const stakes = {} as Record<Outcome, number>;
  for (const o of OUTCOMES) stakes[o] = inv[o] / sum;
  return { sum, hasArb: sum < 1, profitRate: 1 / sum - 1, stakes };
}
