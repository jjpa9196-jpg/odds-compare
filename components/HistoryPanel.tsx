// components/HistoryPanel.tsx
"use client";
import { Match } from "@/lib/types";

function title(m: Match): string {
  if (m.name && m.name !== "新比赛") return m.name;
  const vs = `${m.home || ""} ${m.away ? "vs " + m.away : ""}`.trim();
  return vs || "未命名比赛";
}

function when(ts: number): string {
  return new Date(ts).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoryPanel({
  matches,
  currentId,
  onSelect,
  onDelete,
}: {
  matches: Match[];
  currentId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const sorted = [...matches].sort((a, b) => b.updatedAt - a.updatedAt);
  return (
    <ul className="max-h-72 space-y-1 overflow-y-auto">
      {sorted.map((m) => (
        <li
          key={m.id}
          className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
            m.id === currentId
              ? "border-amber-400/60 bg-amber-400/10"
              : "border-zinc-800 bg-zinc-900"
          }`}
        >
          <button className="min-w-0 flex-1 text-left" onClick={() => onSelect(m.id)}>
            <div className="truncate text-sm text-zinc-100">{title(m)}</div>
            <div className="text-xs text-zinc-500">
              {m.sport} · {when(m.updatedAt)}
            </div>
          </button>
          <button
            onClick={() => onDelete(m.id)}
            className="ml-2 shrink-0 text-zinc-500 transition-colors hover:text-rose-400"
            aria-label="删除记录"
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}
