"use client";

import { History, RotateCcw, Trash2, X } from "lucide-react";

import {
  clearHistory,
  removeHistoryEntry,
  useHistory,
  type HistoryEntry,
} from "@/lib/history";

type HistoryPanelProps = {
  onRestore: (entry: HistoryEntry) => void;
};

function previewExpression(entry: HistoryEntry) {
  if (entry.mode === "alglin") {
    try {
      const grid = JSON.parse(entry.params.expression) as string[][];
      return `Matriz ${grid.length}×${grid[0]?.length ?? 0}`;
    } catch {
      return "Matriz";
    }
  }
  return entry.params.expression;
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoryPanel({ onRestore }: HistoryPanelProps) {
  const history = useHistory();

  return (
    <div className="glass rounded-[28px] p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm uppercase tracking-[0.2em] text-zinc-500">
            Histórico
          </div>
          <h3 className="mt-3 flex items-center gap-2 text-xl font-semibold text-white">
            <History size={18} className="text-[#005EB8]" />
            Cálculos recentes
          </h3>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={clearHistory}
            className="inline-flex items-center gap-2 rounded-xl border border-white/8 px-3 py-2 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-white"
          >
            <Trash2 size={14} />
            Limpar
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Os cálculos que você fizer aparecem aqui e ficam salvos neste navegador.
        </p>
      ) : (
        <ul className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
          {history.map((entry) => (
            <li
              key={entry.id}
              className="rounded-2xl border border-white/8 bg-black/30 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-[#005EB8]/20 px-3 py-1 text-xs font-medium text-[#4da3ff]">
                  {entry.operation}
                </span>
                <span className="text-xs text-zinc-500">
                  {formatDate(entry.createdAt)}
                </span>
              </div>

              <div className="mt-3 truncate font-mono text-sm text-white">
                {previewExpression(entry)}
              </div>
              <div className="mt-1 truncate font-mono text-sm text-zinc-400">
                = {entry.result.split("\n")[0]}
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => onRestore(entry)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/8 px-3 py-2 text-xs text-zinc-200 transition hover:bg-white/5"
                >
                  <RotateCcw size={14} />
                  Reabrir
                </button>
                <button
                  type="button"
                  onClick={() => removeHistoryEntry(entry.id)}
                  aria-label="Remover do histórico"
                  className="inline-flex items-center rounded-xl border border-white/8 px-3 py-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}