"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { MathTex } from "@/components/calculator/math-tex";
import { StepsPanel } from "@/components/calculator/steps-panel";
import type { AnalysisResult, CalcMode, CalcStep } from "@/lib/math-api";

type ResultStatus = "idle" | "success" | "error";

type ResultPanelProps = {
  mode: CalcMode;
  expression: string;
  selectedOperation: string;
  status: ResultStatus;
  computedResult: string;
  latex: string;
  steps: CalcStep[];
  error: string;
  analysis?: AnalysisResult;
};

const MODE_TITLES: Record<CalcMode, string> = {
  alglin: "Análise Matricial e Vetorial",
  calc1: "Análise da Função",
};

const STATUS_LABELS: Record<ResultStatus, string> = {
  idle: "Aguardando",
  success: "Processado",
  error: "Erro",
};

// Converte a grade JSON da entrada em LaTeX para exibir a matriz de forma legível
function gridToLatex(expression: string): string | null {
  try {
    const data: unknown = JSON.parse(expression);
    if (!Array.isArray(data) || data.length === 0) return null;
    const body = (data as unknown[][])
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? "").trim();
            return value === "" ? "0" : value;
          })
          .join(" & ")
      )
      .join(" \\\\ ");
    return `\\begin{bmatrix} ${body} \\end{bmatrix}`;
  } catch {
    return null;
  }
}

type AnalysisItem = { label: string; values: string[] | string | undefined };

function AnalysisCard({ label, values }: AnalysisItem) {
  const list = Array.isArray(values) ? values : values ? [values] : [];

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
      <div className="text-sm text-zinc-500">{label}</div>
      {list.length === 0 ? (
        <div className="mt-2 text-base text-zinc-600">Nenhum</div>
      ) : (
        <ul className="mt-2 space-y-1 font-mono text-sm text-white">
          {list.map((item, index) => (
            <li key={`${index}-${item}`} className="break-words">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FunctionAnalysis({ analysis }: { analysis: NonNullable<AnalysisResult> }) {
  const items: AnalysisItem[] = [
    { label: "Primeira derivada", values: analysis.first_derivative },
    { label: "Segunda derivada", values: analysis.second_derivative },
    { label: "Pontos críticos (x)", values: analysis.critical_points },
    { label: "Máximos locais", values: analysis.local_maxima },
    { label: "Mínimos locais", values: analysis.local_minima },
    { label: "Candidatos a inflexão (x)", values: analysis.inflection_candidates },
    { label: "Intervalos crescentes", values: analysis.increasing_intervals },
    { label: "Intervalos decrescentes", values: analysis.decreasing_intervals },
    { label: "Concavidade para cima", values: analysis.concave_up_intervals },
    { label: "Concavidade para baixo", values: analysis.concave_down_intervals },
    { label: "Assíntotas verticais (x)", values: analysis.vertical_asymptotes },
  ];

  return (
    <div className="mt-5">
      {analysis.mode_message && (
        <p className="mb-4 text-sm text-zinc-400">{analysis.mode_message}</p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <AnalysisCard key={item.label} {...item} />
        ))}
      </div>
    </div>
  );
}

export function ResultPanel({
  mode,
  expression,
  selectedOperation,
  status,
  computedResult,
  latex,
  steps,
  error,
  analysis,
}: ResultPanelProps) {
  const [copied, setCopied] = useState<"text" | "latex" | null>(null);

  const matrixInput = mode === "alglin" ? gridToLatex(expression) : null;
  const showFunctionAnalysis =
    selectedOperation === "Estudo de Função" && status === "success" && !!analysis;

  async function copy(kind: "text" | "latex", value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard indisponível (ex.: contexto sem HTTPS): ignora silenciosamente
    }
  }

  return (
    <div className="glass rounded-[28px] p-6">
      <div className="mb-5">
        <div className="text-sm uppercase tracking-[0.2em] text-zinc-500">
          Resultado
        </div>
        <h3 className="mt-3 text-2xl font-semibold text-white">
          {MODE_TITLES[mode]}
        </h3>
      </div>

      <div className="mb-5 rounded-2xl border border-white/8 bg-black/30 p-4">
        <div className="text-sm text-zinc-500">
          {mode === "alglin" ? "Dados de Entrada" : "Expressão atual"}
        </div>
        {matrixInput ? (
          <div className="mt-2 text-white">
            <MathTex tex={matrixInput} />
          </div>
        ) : (
          <div className="mt-2 break-words font-mono text-base text-white">
            {expression.trim() || "—"}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <div className="text-sm text-zinc-500">Operação</div>
          <div className="mt-2 text-lg font-medium text-white">
            {selectedOperation}
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <div className="text-sm text-zinc-500">Status</div>
          <div
            className={`mt-2 text-lg font-medium ${
              status === "error" ? "text-red-400" : "text-white"
            }`}
          >
            {STATUS_LABELS[status]}
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 md:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-zinc-500">Resultado da Operação</div>

            {status === "success" && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => copy("text", computedResult)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/8 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/5"
                >
                  {copied === "text" ? <Check size={14} /> : <Copy size={14} />}
                  Copiar texto
                </button>
                {latex && (
                  <button
                    type="button"
                    onClick={() => copy("latex", latex)}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/8 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/5"
                  >
                    {copied === "latex" ? <Check size={14} /> : <Copy size={14} />}
                    Copiar LaTeX
                  </button>
                )}
              </div>
            )}
          </div>

          {status === "success" && latex ? (
            <div className="mt-3 text-white">
              <MathTex tex={latex} />
            </div>
          ) : (
            <div
              className={`mt-2 whitespace-pre-wrap break-words font-mono text-base leading-7 ${
                status === "error" ? "text-red-300" : "text-white"
              }`}
            >
              {status === "error" ? error : computedResult}
            </div>
          )}
        </div>
      </div>

      {showFunctionAnalysis && analysis && <FunctionAnalysis analysis={analysis} />}

      {status === "success" && <StepsPanel steps={steps} />}
    </div>
  );
}