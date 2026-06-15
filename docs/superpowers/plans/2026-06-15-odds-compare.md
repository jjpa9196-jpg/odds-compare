# 赔率对比工具 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 做一个本地 / Vercel 网页，以 bestxx 为基准手动填入各平台 1X2 赔率，实时算出 bestxx 相对竞品的偏离度，并附带最优家、水位、套利率。

**Architecture:** Next.js (App Router) + TypeScript 纯前端应用，无后端。所有计算放在可单测的纯函数 `lib/odds.ts`；比赛数据存浏览器 localStorage；UI 由 `OddsTable` + `ResultPanel` 两个组件 + `app/page.tsx` 组装。

**Tech Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Vitest（单测 `lib/odds.ts`）。

---

## File Structure

- `lib/types.ts` — 共享类型：`Outcome` / `OddsFormat` / `Platform` / `Match`。
- `lib/odds.ts` — 纯计算函数：格式换算、隐含概率、水位、去水、最优家、套利、偏离度。
- `lib/odds.test.ts` — `lib/odds.ts` 的单测。
- `lib/storage.ts` — localStorage 读写比赛数据 + 默认平台。
- `components/OddsTable.tsx` — 可编辑赔率表格。
- `components/ResultPanel.tsx` — 底部实时结果。
- `app/page.tsx` — 组装 + 全局状态（当前比赛、赔率格式）。
- `app/layout.tsx` / `app/globals.css` — 脚手架默认。

约定：列结果固定 `['1','X','2']`；内部计算一律用**欧赔**；输入按 `match.oddsFormat` 解释。

---

### Task 1: 项目脚手架

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `vitest.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `tailwind.config.ts`, `postcss.config.mjs`

- [ ] **Step 1: 初始化 Next.js + TS + Tailwind**

在项目根 `/Users/jpwork/tiger code/odds-compare` 执行（目录已是 git 仓库且含 docs/，用 `.` 在当前目录初始化）：

```bash
cd "/Users/jpwork/tiger code/odds-compare"
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --eslint --import-alias "@/*" --use-npm --no-turbopack
```

遇到 “directory not empty” 提示时选择继续（保留已有 docs/ 与 .git）。

- [ ] **Step 2: 安装 Vitest**

```bash
npm install -D vitest
```

- [ ] **Step 3: 加测试脚本与 vitest 配置**

在 `package.json` 的 `"scripts"` 加：

```json
"test": "vitest run",
"test:watch": "vitest"
```

创建 `vitest.config.ts`：

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: 验证脚手架能跑**

Run: `npm run build`
Expected: 构建成功（默认首页）。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js + TS + Tailwind + Vitest"
```

---

### Task 2: 共享类型

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: 写类型**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add shared types"
```

---

### Task 3: 格式换算 + 隐含概率

**Files:**
- Create: `lib/odds.ts`
- Test: `lib/odds.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// lib/odds.test.ts
import { describe, it, expect } from "vitest";
import { toEuro, impliedProb } from "./odds";

describe("toEuro", () => {
  it("香港盘加 1 得欧赔", () => {
    expect(toEuro(0.61, "hk")).toBeCloseTo(1.61, 5);
  });
  it("欧赔原样返回", () => {
    expect(toEuro(2.9, "eu")).toBeCloseTo(2.9, 5);
  });
  it("null 返回 null", () => {
    expect(toEuro(null, "hk")).toBeNull();
  });
});

describe("impliedProb", () => {
  it("1/欧赔", () => {
    expect(impliedProb(2)).toBeCloseTo(0.5, 5);
  });
  it("非正欧赔返回 null", () => {
    expect(impliedProb(0)).toBeNull();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test`
Expected: FAIL（`toEuro` / `impliedProb` 未定义）。

- [ ] **Step 3: 最小实现**

```ts
// lib/odds.ts
import { Outcome, OUTCOMES, OddsFormat, Platform } from "./types";

/** 把用户填的原始赔率按格式转成欧赔；null/非法返回 null */
export function toEuro(value: number | null, format: OddsFormat): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  if (format === "hk") {
    return value > 0 ? value + 1 : null;
  }
  // eu
  return value > 1 ? value : null;
}

/** 隐含概率 = 1/欧赔；欧赔需 > 0 */
export function impliedProb(euroOdds: number | null): number | null {
  if (euroOdds === null || !Number.isFinite(euroOdds) || euroOdds <= 0) return null;
  return 1 / euroOdds;
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add lib/odds.ts lib/odds.test.ts
git commit -m "feat: odds format conversion + implied probability"
```

---

### Task 4: 水位（overround）+ 去水公平概率

**Files:**
- Modify: `lib/odds.ts`
- Test: `lib/odds.test.ts`

- [ ] **Step 1: 写失败测试**

追加到 `lib/odds.test.ts`：

```ts
import { overround, fairProbs } from "./odds";

describe("overround", () => {
  it("三个欧赔的水位 = ∑(1/d) - 1", () => {
    // 三个 3.0 → 1/3*3 = 1 → overround 0
    expect(overround([3, 3, 3])).toBeCloseTo(0, 5);
  });
  it("有 null 则返回 null（信息不全）", () => {
    expect(overround([3, null, 3])).toBeNull();
  });
});

describe("fairProbs", () => {
  it("归一化到和为 1", () => {
    const p = fairProbs([2, 4, 4]);
    expect(p).not.toBeNull();
    const sum = p!.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
    expect(p![0]).toBeGreaterThan(p![1]); // 2.0 概率高于 4.0
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test`
Expected: FAIL（`overround` / `fairProbs` 未定义）。

- [ ] **Step 3: 最小实现**

追加到 `lib/odds.ts`：

```ts
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
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add lib/odds.ts lib/odds.test.ts
git commit -m "feat: overround + de-vigged fair probabilities"
```

---

### Task 5: 每结果最优家 + 套利

**Files:**
- Modify: `lib/odds.ts`
- Test: `lib/odds.test.ts`

- [ ] **Step 1: 写失败测试**

追加到 `lib/odds.test.ts`：

```ts
import { bestByOutcome, arbitrage } from "./odds";

const FORMAT = "eu" as const;

describe("bestByOutcome", () => {
  it("每个结果挑最高欧赔及其平台名", () => {
    const platforms = [
      { name: "A", odds: { "1": 2.0, "X": 3.0, "2": 4.0 } },
      { name: "B", odds: { "1": 2.2, "X": 3.0, "2": 3.5 } },
    ];
    const best = bestByOutcome(platforms, FORMAT);
    expect(best["1"]).toEqual({ euro: 2.2, platform: "B" });
    expect(best["2"]).toEqual({ euro: 4.0, platform: "A" });
  });
});

describe("arbitrage", () => {
  it("∑(1/最优) < 1 判为有套利并给出利润率与下注比例", () => {
    // 三个 4.0 的最优欧赔 → ∑ = 0.75 < 1
    const platforms = [{ name: "A", odds: { "1": 4.0, "X": 4.0, "2": 4.0 } }];
    const r = arbitrage(platforms, FORMAT);
    expect(r.hasArb).toBe(true);
    expect(r.sum).toBeCloseTo(0.75, 5);
    expect(r.profitRate).toBeCloseTo(1 / 0.75 - 1, 5);
    const stakeSum = (r.stakes!["1"] + r.stakes!["X"] + r.stakes!["2"]);
    expect(stakeSum).toBeCloseTo(1, 5);
  });
  it("信息不全时 hasArb=false, sum=null", () => {
    const platforms = [{ name: "A", odds: { "1": 4.0, "X": null, "2": 4.0 } }];
    const r = arbitrage(platforms, FORMAT);
    expect(r.hasArb).toBe(false);
    expect(r.sum).toBeNull();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test`
Expected: FAIL（`bestByOutcome` / `arbitrage` 未定义）。

- [ ] **Step 3: 最小实现**

追加到 `lib/odds.ts`：

```ts
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
  sum: number | null; // ∑(1/最优欧赔)
  hasArb: boolean;
  profitRate: number | null; // 1/sum - 1
  stakes: Record<Outcome, number> | null; // 下注比例，和为 1
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
  return {
    sum,
    hasArb: sum < 1,
    profitRate: 1 / sum - 1,
    stakes,
  };
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add lib/odds.ts lib/odds.test.ts
git commit -m "feat: best odds per outcome + arbitrage"
```

---

### Task 6: bestxx 偏离度（头条指标）

**Files:**
- Modify: `lib/odds.ts`
- Test: `lib/odds.test.ts`

- [ ] **Step 1: 写失败测试**

追加到 `lib/odds.test.ts`：

```ts
import { deviation } from "./odds";

describe("deviation", () => {
  const platforms = [
    { name: "bestxx", isReference: true, odds: { "1": 2.10, "X": 3.0, "2": 3.0 } },
    { name: "c1", odds: { "1": 2.30, "X": 3.0, "2": 3.0 } },
    { name: "c2", odds: { "1": 2.30, "X": 3.0, "2": 3.0 } },
  ];
  it("基准低于竞品均值 → 负偏离并标 low", () => {
    const d = deviation(platforms, "eu", 0.03);
    // 竞品均值 2.30，基准 2.10 → 2.10/2.30 - 1 ≈ -0.087
    expect(d["1"]!.pct).toBeCloseTo(2.1 / 2.3 - 1, 4);
    expect(d["1"]!.flag).toBe("low");
    expect(d["X"]!.flag).toBe("ok"); // 一致
  });
  it("没有基准平台 → 全 null", () => {
    const d = deviation([{ name: "c1", odds: { "1": 2.0, "X": 3, "2": 3 } }], "eu", 0.03);
    expect(d["1"]).toBeNull();
  });
  it("基准在但竞品一家都没填该结果 → 该结果 null", () => {
    const only = [
      { name: "bestxx", isReference: true, odds: { "1": 2.0, "X": null, "2": null } },
    ];
    const d = deviation(only, "eu", 0.03);
    expect(d["1"]).toBeNull();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test`
Expected: FAIL（`deviation` 未定义）。

- [ ] **Step 3: 最小实现**

追加到 `lib/odds.ts`：

```ts
export type DeviationFlag = "high" | "low" | "ok";
export interface DeviationItem {
  refEuro: number;
  compMean: number;
  pct: number; // refEuro/compMean - 1
  flag: DeviationFlag;
}
export type DeviationByOutcome = Record<Outcome, DeviationItem | null>;

/** bestxx 相对竞品均值的偏离度；threshold 默认 0.03 */
export function deviation(
  platforms: Pick<Platform, "name" | "isReference" | "odds">[],
  format: OddsFormat,
  threshold = 0.03
): DeviationByOutcome {
  const ref = platforms.find((p) => p.isReference);
  const comps = platforms.filter((p) => !p.isReference);
  const result = {} as DeviationByOutcome;
  for (const o of OUTCOMES) {
    const refEuro = ref ? toEuro(ref.odds[o], format) : null;
    const compEuros = comps
      .map((p) => toEuro(p.odds[o], format))
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
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test`
Expected: PASS。

- [ ] **Step 5: 用截图真实数据加一条回归测试**

追加到 `lib/odds.test.ts`：

```ts
describe("截图数据回归（香港盘）", () => {
  it("沙特 6.20/3.20/0.48 港盘 → 欧赔与隐含概率", () => {
    expect(toEuro(6.2, "hk")).toBeCloseTo(7.2, 5);
    expect(toEuro(0.48, "hk")).toBeCloseTo(1.48, 5);
    expect(impliedProb(toEuro(0.48, "hk"))).toBeCloseTo(1 / 1.48, 5);
  });
});
```

Run: `npm test`
Expected: PASS。

- [ ] **Step 6: Commit**

```bash
git add lib/odds.ts lib/odds.test.ts
git commit -m "feat: bestxx deviation vs competitors + screenshot regression"
```

---

### Task 7: localStorage 存储 + 默认平台

**Files:**
- Create: `lib/storage.ts`

- [ ] **Step 1: 写实现**

```ts
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

/** 生成一场空比赛（不依赖 Date.now/随机，由调用方传 id） */
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
```

- [ ] **Step 2: 构建验证（类型正确）**

Run: `npx tsc --noEmit`
Expected: 无类型错误。

- [ ] **Step 3: Commit**

```bash
git add lib/storage.ts
git commit -m "feat: localStorage persistence + default platforms"
```

---

### Task 8: OddsTable 组件

**Files:**
- Create: `components/OddsTable.tsx`

- [ ] **Step 1: 写组件**

```tsx
// components/OddsTable.tsx
"use client";
import { Match, Outcome, OUTCOMES, Platform } from "@/lib/types";

const LABEL: Record<Outcome, string> = { "1": "主胜 1", X: "平局 X", "2": "客胜 2" };

export function OddsTable({
  match,
  onChange,
}: {
  match: Match;
  onChange: (platforms: Platform[]) => void;
}) {
  function setOdds(idx: number, o: Outcome, raw: string) {
    const v = raw.trim() === "" ? null : Number(raw);
    const next = match.platforms.map((p, i) =>
      i === idx ? { ...p, odds: { ...p.odds, [o]: v } } : p
    );
    onChange(next);
  }
  function setName(idx: number, name: string) {
    onChange(match.platforms.map((p, i) => (i === idx ? { ...p, name } : p)));
  }
  function addRow() {
    onChange([...match.platforms, { name: "新平台", odds: { "1": null, X: null, "2": null } }]);
  }
  function removeRow(idx: number) {
    onChange(match.platforms.filter((_, i) => i !== idx));
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th className="border p-2 text-left">平台</th>
          {OUTCOMES.map((o) => (
            <th key={o} className="border p-2">{LABEL[o]}</th>
          ))}
          <th className="border p-2"></th>
        </tr>
      </thead>
      <tbody>
        {match.platforms.map((p, idx) => (
          <tr key={idx} className={p.isReference ? "bg-yellow-50 font-medium" : ""}>
            <td className="border p-2">
              <input
                className="w-28 bg-transparent outline-none"
                value={p.name}
                onChange={(e) => setName(idx, e.target.value)}
              />
              {p.isReference && <span className="ml-1 text-xs text-yellow-700">基准</span>}
            </td>
            {OUTCOMES.map((o) => (
              <td key={o} className="border p-2 text-center">
                <input
                  inputMode="decimal"
                  className="w-16 text-center bg-transparent outline-none"
                  value={p.odds[o] ?? ""}
                  onChange={(e) => setOdds(idx, o, e.target.value)}
                />
              </td>
            ))}
            <td className="border p-2 text-center">
              {!p.isReference && (
                <button onClick={() => removeRow(idx)} className="text-red-500">×</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={OUTCOMES.length + 2} className="p-2">
            <button onClick={addRow} className="text-blue-600">+ 加平台</button>
          </td>
        </tr>
      </tfoot>
    </table>
  );
}
```

- [ ] **Step 2: 构建验证**

Run: `npx tsc --noEmit`
Expected: 无类型错误。

- [ ] **Step 3: Commit**

```bash
git add components/OddsTable.tsx
git commit -m "feat: editable odds table component"
```

---

### Task 9: ResultPanel 组件

**Files:**
- Create: `components/ResultPanel.tsx`

- [ ] **Step 1: 写组件**

```tsx
// components/ResultPanel.tsx
"use client";
import { Match, Outcome, OUTCOMES } from "@/lib/types";
import {
  arbitrage,
  bestByOutcome,
  deviation,
  overround,
  toEuro,
} from "@/lib/odds";

const LABEL: Record<Outcome, string> = { "1": "主胜", X: "平局", "2": "客胜" };
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

export function ResultPanel({ match }: { match: Match }) {
  const fmt = match.oddsFormat;
  const dev = deviation(match.platforms, fmt);
  const best = bestByOutcome(match.platforms, fmt);
  const arb = arbitrage(match.platforms, fmt);

  return (
    <div className="mt-6 space-y-4 text-sm">
      <section className="rounded border p-3">
        <h2 className="font-semibold mb-2">bestxx 偏离度（vs 竞品均值）</h2>
        <div className="grid grid-cols-3 gap-2">
          {OUTCOMES.map((o) => {
            const d = dev[o];
            if (!d) return <div key={o} className="text-gray-400">{LABEL[o]}：无对比</div>;
            const color =
              d.flag === "high" ? "text-blue-600" : d.flag === "low" ? "text-red-600" : "text-gray-700";
            const tag = d.flag === "high" ? "偏高" : d.flag === "low" ? "偏低" : "一致";
            return (
              <div key={o} className={color}>
                {LABEL[o]}：{pct(d.pct)} <span className="text-xs">({tag})</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded border p-3">
        <h2 className="font-semibold mb-2">每结果最优家</h2>
        <div className="grid grid-cols-3 gap-2">
          {OUTCOMES.map((o) => (
            <div key={o}>
              {LABEL[o]}：{best[o] ? `${best[o]!.platform} (${best[o]!.euro.toFixed(2)})` : "—"}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded border p-3">
        <h2 className="font-semibold mb-2">各家水位（overround）</h2>
        <ul>
          {match.platforms.map((p, i) => {
            const or = overround(OUTCOMES.map((o) => toEuro(p.odds[o], fmt)));
            return (
              <li key={i}>
                {p.name}：{or === null ? "—" : pct(or)}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded border p-3">
        <h2 className="font-semibold mb-2">套利率（次要参考）</h2>
        {arb.sum === null ? (
          <p className="text-gray-400">信息不全</p>
        ) : arb.hasArb ? (
          <p className="text-green-600">
            有套利：∑={arb.sum.toFixed(4)}，保证利润 {pct(arb.profitRate!)}；下注比例{" "}
            {OUTCOMES.map((o) => `${LABEL[o]} ${pct(arb.stakes![o])}`).join(" / ")}
          </p>
        ) : (
          <p>无套利：∑={arb.sum.toFixed(4)}</p>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: 构建验证**

Run: `npx tsc --noEmit`
Expected: 无类型错误。

- [ ] **Step 3: Commit**

```bash
git add components/ResultPanel.tsx
git commit -m "feat: result panel (deviation headline + arb/overround/best)"
```

---

### Task 10: 页面组装

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: 写页面**

整体替换 `app/page.tsx`：

```tsx
// app/page.tsx
"use client";
import { useEffect, useState } from "react";
import { Match, OddsFormat, Platform } from "@/lib/types";
import { loadMatches, saveMatches, newMatch } from "@/lib/storage";
import { OddsTable } from "@/components/OddsTable";
import { ResultPanel } from "@/components/ResultPanel";

export default function Home() {
  const [match, setMatch] = useState<Match | null>(null);

  // 初次加载：取第一场，没有就新建（id 用浏览器 crypto，避免计算层用 Date/随机）
  useEffect(() => {
    const all = loadMatches();
    if (all.length > 0) {
      setMatch(all[0]);
    } else {
      setMatch(newMatch(crypto.randomUUID(), "新比赛"));
    }
  }, []);

  // 任何改动即存
  useEffect(() => {
    if (match) saveMatches([match]);
  }, [match]);

  if (!match) return <main className="p-6">加载中…</main>;

  const setPlatforms = (platforms: Platform[]) => setMatch({ ...match, platforms });
  const setFormat = (oddsFormat: OddsFormat) => setMatch({ ...match, oddsFormat });

  return (
    <main className="mx-auto max-w-2xl p-4">
      <div className="mb-4 flex items-center gap-3">
        <input
          className="flex-1 border-b text-lg outline-none"
          value={match.name}
          onChange={(e) => setMatch({ ...match, name: e.target.value })}
        />
        <select
          className="border rounded p-1"
          value={match.oddsFormat}
          onChange={(e) => setFormat(e.target.value as OddsFormat)}
        >
          <option value="hk">香港盘</option>
          <option value="eu">欧赔</option>
        </select>
      </div>
      <OddsTable match={match} onChange={setPlatforms} />
      <ResultPanel match={match} />
    </main>
  );
}
```

- [ ] **Step 2: 全量验证**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: 测试 PASS、无类型错误、构建成功。

- [ ] **Step 3: 本地手测**

Run: `npm run dev`，浏览器开 `http://localhost:3000`：
- 默认看到 4 行（bestxx 基准高亮 + bc.game/qzino/188bet）。
- 填入 bestxx `1`=2.10、bc.game `1`=2.30、qzino `1`=2.30 → 偏离度显示约 −8.7%（偏低，红色）。
- 刷新页面数据还在（localStorage）。

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: assemble page with format toggle + persistence"
```

---

### Task 11（可选）: 部署到 Vercel

- [ ] **Step 1: 推到 GitHub 并在 Vercel 导入**

```bash
gh repo create odds-compare --public --source=. --remote=origin --push
```

在 Vercel 控制台 import 该仓库，框架自动识别 Next.js，直接 Deploy。无需环境变量（纯前端）。

- [ ] **Step 2: 验证线上**

打开 Vercel 给的 URL，重复 Task 10 Step 3 的手测。

---

## Self-Review notes

- **Spec coverage:** 1X2 only ✅(类型固定 OUTCOMES)；手动填 ✅；欧/港切换 ✅(Task 3 + page select)；最优家/隐含概率/水位/去水/套利 ✅(Task 3–5)；bestxx 偏离度头条 ✅(Task 6 + ResultPanel)；localStorage ✅(Task 7)；默认 4 平台 ✅(Task 7)；Next.js+Vercel ✅(Task 1/11)；模块划分对齐 spec ✅。
- **Placeholders:** 无 TODO/TBD；每个代码步骤都有完整代码。
- **Type consistency:** `toEuro/impliedProb/overround/fairProbs/bestByOutcome/arbitrage/deviation` 在 Task 3–6 定义，Task 8–10 仅消费这些已定义符号；`Outcome/OUTCOMES/OddsFormat/Platform/Match` 全部来自 `lib/types.ts`。
- **Date/随机：** 计算层不用 Date/随机；id 由 page 用 `crypto.randomUUID()` 注入到 `newMatch(id)`。
