import { OddsFormat } from "./types";

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
