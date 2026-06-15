// lib/types.ts
export type Outcome = "1" | "X" | "2";
export const OUTCOMES: Outcome[] = ["1", "X", "2"];

export type OddsFormat = "eu" | "hk"; // 欧赔 / 香港盘

export interface Platform {
  name: string;
  isReference?: boolean; // bestxx = true
  odds: Record<Outcome, number | null>; // 用户填的原始值（按 match.oddsFormat 解释）
}

export interface Match {
  id: string;
  name: string;
  oddsFormat: OddsFormat;
  platforms: Platform[];
}
