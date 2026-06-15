// lib/exportCsv.ts
import { Match, MARKETS } from "./types";
import { deviation } from "./odds";
import { marketPlatforms } from "./match";

function esc(s: string | number): string {
  const str = String(s);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function marketHasData(match: Match, marketKey: string): boolean {
  const mo = match.odds[marketKey];
  return !!mo && mo.values.some((row) => Object.values(row).some((v) => v !== null));
}

const fmtPct = (x: number) => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(1)}%`;

/** 把一场比赛导成 CSV 文本（含 BOM，Excel 可直接打开中文） */
export function matchToCsv(match: Match): string {
  const rows: string[] = [];
  const line = (cells: (string | number)[]) => rows.push(cells.map(esc).join(","));

  line(["比赛", match.name]);
  line(["运动", match.sport]);
  line(["对阵", `${match.home || "主队"} vs ${match.away || "客队"}`]);
  line(["赔率格式", match.oddsFormat === "hk" ? "香港盘" : "欧赔"]);
  line(["更新时间", new Date(match.updatedAt).toLocaleString("zh-CN")]);
  rows.push("");

  for (const m of MARKETS) {
    if (!marketHasData(match, m.key)) continue;
    const keys = m.outcomes.map((o) => o.key);
    const labels = m.outcomes.map((o) => o.label);
    const mo = match.odds[m.key];
    const header = m.hasLine && mo.line ? `${m.name}（盘口 ${mo.line}）` : m.name;
    line([`玩法: ${header}`]);
    line(["平台", ...labels]);
    match.platforms.forEach((p, i) => {
      line([
        p.isReference ? `${p.name}(基准)` : p.name,
        ...keys.map((k) => {
          const v = mo.values[i]?.[k];
          return v === null || v === undefined ? "" : v;
        }),
      ]);
    });
    const dev = deviation(marketPlatforms(match, m.key), keys, match.oddsFormat);
    line(["bestxx 偏离度", ...keys.map((k) => (dev[k] ? fmtPct(dev[k]!.pct) : "-"))]);
    rows.push("");
  }

  return "﻿" + rows.join("\n");
}

/** 触发浏览器下载一个文本文件 */
export function downloadText(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
