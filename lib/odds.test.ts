import { describe, it, expect } from "vitest";
import {
  toEuro,
  impliedProb,
  overround,
  fairProbs,
  bestByOutcome,
  arbitrage,
  deviation,
  consistency,
} from "./odds";

const FORMAT = "eu" as const;
const K3 = ["1", "X", "2"]; // 三路玩法
const K2 = ["O", "U"]; // 两路玩法（大小球）

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

describe("overround", () => {
  it("三个欧赔的水位 = ∑(1/d) - 1", () => {
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
    expect(p![0]).toBeGreaterThan(p![1]);
  });
});

describe("bestByOutcome", () => {
  it("每个结果挑最高欧赔及其平台名", () => {
    const platforms = [
      { name: "A", odds: { "1": 2.0, "X": 3.0, "2": 4.0 } },
      { name: "B", odds: { "1": 2.2, "X": 3.0, "2": 3.5 } },
    ];
    const best = bestByOutcome(platforms, K3, FORMAT);
    expect(best["1"]).toEqual({ euro: 2.2, platform: "B" });
    expect(best["2"]).toEqual({ euro: 4.0, platform: "A" });
  });
  it("两路玩法（大小球）一样适用", () => {
    const platforms = [
      { name: "A", odds: { O: 1.9, U: 1.95 } },
      { name: "B", odds: { O: 1.85, U: 2.0 } },
    ];
    const best = bestByOutcome(platforms, K2, FORMAT);
    expect(best["O"]).toEqual({ euro: 1.9, platform: "A" });
    expect(best["U"]).toEqual({ euro: 2.0, platform: "B" });
  });
});

describe("arbitrage", () => {
  it("∑(1/最优) < 1 判为有套利并给出利润率与下注比例", () => {
    const platforms = [{ name: "A", odds: { "1": 4.0, "X": 4.0, "2": 4.0 } }];
    const r = arbitrage(platforms, K3, FORMAT);
    expect(r.hasArb).toBe(true);
    expect(r.sum).toBeCloseTo(0.75, 5);
    expect(r.profitRate).toBeCloseTo(1 / 0.75 - 1, 5);
    const stakeSum = r.stakes!["1"] + r.stakes!["X"] + r.stakes!["2"];
    expect(stakeSum).toBeCloseTo(1, 5);
  });
  it("信息不全时 hasArb=false, sum=null", () => {
    const platforms = [{ name: "A", odds: { "1": 4.0, "X": null, "2": 4.0 } }];
    const r = arbitrage(platforms, K3, FORMAT);
    expect(r.hasArb).toBe(false);
    expect(r.sum).toBeNull();
  });
});

describe("deviation", () => {
  const platforms = [
    { name: "bestxx", isReference: true, odds: { "1": 2.1, "X": 3.0, "2": 3.0 } },
    { name: "c1", odds: { "1": 2.3, "X": 3.0, "2": 3.0 } },
    { name: "c2", odds: { "1": 2.3, "X": 3.0, "2": 3.0 } },
  ];
  it("基准低于竞品均值 → 负偏离并标 low", () => {
    const d = deviation(platforms, K3, "eu", 0.03);
    expect(d["1"]!.pct).toBeCloseTo(2.1 / 2.3 - 1, 4);
    expect(d["1"]!.flag).toBe("low");
    expect(d["X"]!.flag).toBe("ok");
  });
  it("没有基准平台 → 全 null", () => {
    const d = deviation([{ name: "c1", odds: { "1": 2.0, "X": 3, "2": 3 } }], K3, "eu", 0.03);
    expect(d["1"]).toBeNull();
  });
  it("基准在但竞品一家都没填该结果 → 该结果 null", () => {
    const only = [{ name: "bestxx", isReference: true, odds: { "1": 2.0, "X": null, "2": null } }];
    const d = deviation(only, K3, "eu", 0.03);
    expect(d["1"]).toBeNull();
  });
});

describe("consistency", () => {
  const platforms = [
    { name: "bestxx", isReference: true, odds: { "1": 2.1, "X": 3.0, "2": 3.0 } },
    { name: "c1", odds: { "1": 2.3, "X": 3.0, "2": 3.0 } },
  ];
  it("有结果超阈值 → 不一致并列出偏离项", () => {
    const c = consistency(deviation(platforms, K3, "eu", 0.03));
    expect(c.hasData).toBe(true);
    expect(c.consistent).toBe(false);
    expect(c.offenders).toContain("1"); // 主胜偏低
    expect(c.offenders).not.toContain("X"); // 平局一致
  });
  it("全在阈值内 → 一致", () => {
    const same = [
      { name: "bestxx", isReference: true, odds: { "1": 2.0, "X": 3.0, "2": 3.0 } },
      { name: "c1", odds: { "1": 2.0, "X": 3.0, "2": 3.0 } },
    ];
    const c = consistency(deviation(same, K3, "eu", 0.03));
    expect(c.consistent).toBe(true);
    expect(c.offenders).toEqual([]);
  });
  it("没有可比数据 → hasData=false", () => {
    const c = consistency(deviation([{ name: "c1", odds: { "1": 2.0, "X": 3, "2": 3 } }], K3, "eu"));
    expect(c.hasData).toBe(false);
  });
});

describe("截图数据回归（香港盘）", () => {
  it("沙特 6.20/3.20/0.48 港盘 → 欧赔与隐含概率", () => {
    expect(toEuro(6.2, "hk")).toBeCloseTo(7.2, 5);
    expect(toEuro(0.48, "hk")).toBeCloseTo(1.48, 5);
    expect(impliedProb(toEuro(0.48, "hk"))).toBeCloseTo(1 / 1.48, 5);
  });
});
