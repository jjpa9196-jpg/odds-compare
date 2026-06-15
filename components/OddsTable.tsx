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
