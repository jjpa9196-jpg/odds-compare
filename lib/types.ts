// lib/types.ts
export type OddsFormat = "hk" | "eu" | "id" | "my"; // 香港盘 / 欧赔 / 印尼盘 / 马来盘

export const ODDS_FORMATS: { key: OddsFormat; label: string }[] = [
  { key: "hk", label: "香港盘 HK" },
  { key: "eu", label: "欧赔 EU" },
  { key: "id", label: "印尼盘 ID" },
  { key: "my", label: "马来盘 MY" },
];

export function formatLabel(fmt: OddsFormat): string {
  return ODDS_FORMATS.find((f) => f.key === fmt)?.label ?? fmt;
}

/** 输入提示：每种盘口的有效范围 */
export function formatHint(fmt: OddsFormat): string {
  switch (fmt) {
    case "hk":
      return "香港盘需 > 0";
    case "eu":
      return "欧赔需 > 1";
    case "id":
      return "印尼盘 |值| ≥ 1（正负皆可）";
    case "my":
      return "马来盘 -1~1（不含 0）";
  }
}

export type Sport = "足球" | "篮球" | "网球" | "其他";
export const SPORTS: Sport[] = ["足球", "篮球", "网球", "其他"];

/** 一个结果（盘口里的一项），如 主胜 / 上盘 / 大球 */
export interface OutcomeDef {
  key: string; // 在该玩法内唯一
  label: string;
}

/** 一个玩法（盘口）的定义 = 一组互斥结果 */
export interface MarketDef {
  key: string;
  name: string;
  outcomes: OutcomeDef[];
  hasLine?: boolean; // 让球/大小球需要一个盘口线
  linePlaceholder?: string;
}

const RESULT_1X2: OutcomeDef[] = [
  { key: "1", label: "主胜" },
  { key: "X", label: "平局" },
  { key: "2", label: "客胜" },
];

/** 足球玩法目录（第一版） */
export const MARKETS: MarketDef[] = [
  { key: "ml", name: "全场 1X2", outcomes: RESULT_1X2 },
  {
    key: "ah",
    name: "让球/亚盘",
    hasLine: true,
    linePlaceholder: "盘口 如 -0.5",
    outcomes: [
      { key: "H", label: "上盘" },
      { key: "A", label: "下盘" },
    ],
  },
  {
    key: "ou",
    name: "大小球",
    hasLine: true,
    linePlaceholder: "总进球线 如 2.5",
    outcomes: [
      { key: "O", label: "大球" },
      { key: "U", label: "小球" },
    ],
  },
  {
    key: "hcp",
    name: "让球胜平负",
    hasLine: true,
    linePlaceholder: "让球 如 -1",
    outcomes: RESULT_1X2,
  },
  { key: "ht", name: "半场 1X2", outcomes: RESULT_1X2 },
];

export function marketDef(key: string): MarketDef {
  const m = MARKETS.find((x) => x.key === key);
  if (!m) throw new Error(`unknown market: ${key}`);
  return m;
}

/** 平台基本信息（全局，跨玩法共享） */
export interface PlatformMeta {
  name: string;
  isReference?: boolean; // bestxx = true
}

/** 某玩法下，各平台对每个结果填的赔率（values 下标与 match.platforms 对齐） */
export interface MarketOdds {
  line: string;
  values: Record<string, number | null>[];
}

export interface Match {
  id: string;
  name: string;
  home: string;
  away: string;
  sport: Sport;
  oddsFormat: OddsFormat;
  platforms: PlatformMeta[];
  odds: Record<string, MarketOdds>; // key = MarketDef.key
  createdAt: number; // 毫秒时间戳
  updatedAt: number;
}

/** 传给计算函数的合成形态：平台信息 + 它在某玩法下的赔率 */
export interface PricedPlatform {
  name: string;
  isReference?: boolean;
  odds: Record<string, number | null>;
}
