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

import { overround, fairProbs } from "./odds";

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
