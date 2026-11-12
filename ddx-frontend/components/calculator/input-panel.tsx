"use client";

import { useMemo } from "react";

import type { CalcMode } from "@/lib/math-api";

type InputPanelProps = {
  mode: CalcMode;
  expression: string;
  setExpression: (value: string) => void;
  selectedOperation: string;
  setSelectedOperation: (value: string) => void;
  variables: string;
  setVariables: (value: string) => void;
  interval: string;
  setIntervalValue: (value: string) => void;
  onCalculate: () => void;
  loading: boolean;
  // Props de Cálculo 1
  derivativeOrder: number;
  setDerivativeOrder: (value: number) => void;
  limitPoint: string;
  setLimitPoint: (value: string) => void;
  limitDirection: string;
  setLimitDirection: (value: string) => void;
  tangentPoint: string;
  setTangentPoint: (value: string) => void;
  isDefiniteIntegral: boolean;
  setIsDefiniteIntegral: (value: boolean) => void;
  lowerBound: string;
  setLowerBound: (value: string) => void;
  upperBound: string;
  setUpperBound: (value: string) => void;
};

const ALG_LIN_OPERATIONS = [
  "Determinante",
  "Matriz Inversa",
  "Escalonamento",
  "Sistema Linear",
  "Posto",
  "Núcleo",
  "Transposta",
  "Traço",
  "Decomposição LU",
  "Autovalores e Autovetores",
  "Diagonalização",
];

const CALC1_OPERATIONS = [
  "Derivada",
  "Integral",
  "Limite",
  "Estudo de Função",
  "Raízes",
  "Reta Tangente",
];

const EXAMPLES: Record<string, string[]> = {
  Derivada: ["x**3 - 3*x + 1", "x**2*sin(x)", "exp(2*x)/x"],
  Integral: ["x**2 + sin(x)", "1/x", "x*exp(x)"],
  Limite: ["sin(x)/x", "(2*x + 1)/(x + 3)", "1/x"],
  "Estudo de Função": ["x**3 - 3*x + 1", "x/(x**2 + 1)"],
  Raízes: ["x**2 - 5*x + 6", "x**3 - x"],
  "Reta Tangente": ["x**2", "sin(x)", "exp(x)"],
};

const MATRIX_HINTS: Record<string, string> = {
  "Sistema Linear":
    "Preencha a matriz ampliada [A | b]: a última coluna são os termos independentes.",
  Posto: "Conta o número de pivôs da matriz escalonada.",
  Núcleo: "Encontra uma base do conjunto de vetores v tais que A·v = 0.",
};

const MAX_DIMENSION = 6;

const fieldClass =
  "w-full rounded-2xl border border-white/8 bg-black/30 px-4 py-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-[#005EB8]/40";

const subCardClass = "space-y-5 rounded-2xl border border-white/8 bg-white/[0.02] p-4";

function emptyGrid(rows: number, cols: number): string[][] {
  return Array.from({ length: rows }, () => Array<string>(cols).fill(""));
}

// A grade é derivada da própria expressão (JSON), que é a única fonte da verdade.
// Assim, reabrir um item do histórico atualiza a grade automaticamente.
function parseGrid(expression: string): string[][] {
  try {
    const data: unknown = JSON.parse(expression);
    if (
      Array.isArray(data) &&
      data.length > 0 &&
      data.every(
        (row) => Array.isArray(row) && row.length > 0 && row.length === data[0].length
      )
    ) {
      return (data as unknown[][]).map((row) => row.map((cell) => String(cell ?? "")));
    }
  } catch {
    // cai no padrão abaixo
  }
  return emptyGrid(3, 3);
}

function clampDimension(value: number) {
  return Math.min(MAX_DIMENSION, Math.max(1, Math.floor(value) || 1));
}

export function InputPanel({
  mode,
  expression,
  setExpression,
  selectedOperation,
  setSelectedOperation,
  variables,
  setVariables,
  interval,
  setIntervalValue,
  onCalculate,
  loading,
  derivativeOrder,
  setDerivativeOrder,
  limitPoint,
  setLimitPoint,
  limitDirection,
  setLimitDirection,
  tangentPoint,
  setTangentPoint,
  isDefiniteIntegral,
  setIsDefiniteIntegral,
  lowerBound,
  setLowerBound,
  upperBound,
  setUpperBound,
}: InputPanelProps) {
  const operations = mode === "alglin" ? ALG_LIN_OPERATIONS : CALC1_OPERATIONS;

  const matrix = useMemo(() => parseGrid(expression), [expression]);
  const rows = matrix.length;
  const cols = matrix[0].length;

  const updateMatrix = (next: string[][]) => setExpression(JSON.stringify(next));

  // Ao redimensionar, preserva os valores que continuam dentro da nova grade
  const handleDimensionChange = (newRows: number, newCols: number) => {
    const r = clampDimension(newRows);
    const c = clampDimension(newCols);
    updateMatrix(
      Array.from({ length: r }, (_, i) =>
        Array.from({ length: c }, (_, j) => (i < rows && j < cols ? matrix[i][j] : ""))
      )
    );
  };

  const handleCellChange = (r: number, c: number, value: string) => {
    updateMatrix(
      matrix.map((row, i) => row.map((cell, j) => (i === r && j === c ? value : cell)))
    );
  };

  const fillIdentity = () =>
    updateMatrix(
      Array.from({ length: rows }, (_, i) =>
        Array.from({ length: cols }, (_, j) => (i === j ? "1" : "0"))
      )
    );

  const examples = EXAMPLES[selectedOperation] ?? [];
  const showTangentPoint =
    selectedOperation === "Derivada" || selectedOperation === "Reta Tangente";

  return (
    <div className="glass rounded-[28px] p-6">
      <div className="mb-5">
        <div className="text-sm uppercase tracking-[0.2em] text-zinc-500">
          Entrada
        </div>
        <h3 className="mt-3 text-2xl font-semibold text-white">
          Configuração da Operação
        </h3>
      </div>

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm text-zinc-400">Operação</label>
          <select
            value={selectedOperation}
            onChange={(e) => setSelectedOperation(e.target.value)}
            className={fieldClass}
          >
            {operations.map((operation) => (
              <option key={operation} value={operation}>
                {operation}
              </option>
            ))}
          </select>
        </div>

        {/* GRADE VISUAL PARA ÁLGEBRA LINEAR OU TEXTAREA PARA CÁLCULO */}
        {mode === "alglin" ? (
          <div className={subCardClass}>
            <div className="flex items-center justify-between">
              <label className="text-sm text-zinc-400">Dimensões da Matriz</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={MAX_DIMENSION}
                  value={rows}
                  aria-label="Número de linhas"
                  onChange={(e) => handleDimensionChange(Number(e.target.value), cols)}
                  className="w-12 rounded-lg border border-white/10 bg-black/40 p-1 text-center text-white"
                />
                <span className="text-zinc-500">x</span>
                <input
                  type="number"
                  min={1}
                  max={MAX_DIMENSION}
                  value={cols}
                  aria-label="Número de colunas"
                  onChange={(e) => handleDimensionChange(rows, Number(e.target.value))}
                  className="w-12 rounded-lg border border-white/10 bg-black/40 p-1 text-center text-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto p-2">
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
              >
                {matrix.map((row, r) =>
                  row.map((val, c) => (
                    <input
                      key={`${r}-${c}`}
                      value={val}
                      aria-label={`Linha ${r + 1}, coluna ${c + 1}`}
                      onChange={(e) => handleCellChange(r, c, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onCalculate();
                      }}
                      className="w-full min-w-[50px] rounded-xl border border-white/10 bg-black/30 p-3 text-center text-white outline-none transition focus:border-[#005EB8]/50"
                      placeholder="0"
                    />
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => updateMatrix(emptyGrid(rows, cols))}
                className="rounded-xl border border-white/8 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/5"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={fillIdentity}
                className="rounded-xl border border-white/8 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/5"
              >
                Identidade
              </button>
            </div>

            {MATRIX_HINTS[selectedOperation] && (
              <p className="text-xs text-zinc-500">{MATRIX_HINTS[selectedOperation]}</p>
            )}
          </div>
        ) : (
          <div>
            <label className="mb-2 block text-sm text-zinc-400">Expressão</label>
            <textarea
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) onCalculate();
              }}
              className={`${fieldClass} min-h-[140px] text-base`}
              placeholder="Ex.: x**3 - 3*x + 1"
            />
            <p className="mt-2 text-xs text-zinc-500">
              Use * para multiplicar e ** ou ^ para potência. Ctrl + Enter calcula.
            </p>

            {examples.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {examples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setExpression(example)}
                    className="rounded-full border border-white/8 px-3 py-1.5 font-mono text-xs text-zinc-300 transition hover:bg-white/5"
                  >
                    {example}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CAMPOS DE VARIÁVEL E INTERVALO PARA CÁLCULO 1 */}
        {mode !== "alglin" && (
          <>
            <div>
              <label className="mb-2 block text-sm text-zinc-400">Variável</label>
              <input
                value={variables}
                onChange={(e) => setVariables(e.target.value)}
                className={fieldClass}
                placeholder="x"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Intervalo do gráfico
              </label>
              <input
                value={interval}
                onChange={(e) => setIntervalValue(e.target.value)}
                className={fieldClass}
                placeholder="[-10, 10]"
              />
            </div>
          </>
        )}

        {/* OPÇÕES ESPECÍFICAS DE CADA OPERAÇÃO */}
        {selectedOperation === "Derivada" && (
          <div className={subCardClass}>
            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Ordem da derivada
              </label>
              <select
                value={derivativeOrder}
                onChange={(e) => setDerivativeOrder(Number(e.target.value))}
                className={fieldClass}
              >
                {[1, 2, 3, 4, 5].map((order) => (
                  <option key={order} value={order}>
                    {order}ª derivada
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {showTangentPoint && (
          <div className={subCardClass}>
            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                {selectedOperation === "Derivada"
                  ? "Ponto da reta tangente no gráfico"
                  : "Ponto de tangência (x = a)"}
              </label>
              <input
                value={tangentPoint}
                onChange={(e) => setTangentPoint(e.target.value)}
                className={fieldClass}
                placeholder="0"
              />
            </div>
          </div>
        )}

        {selectedOperation === "Integral" && (
          <div className={subCardClass}>
            <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={isDefiniteIntegral}
                onChange={(e) => setIsDefiniteIntegral(e.target.checked)}
                className="h-4 w-4 accent-[#005EB8]"
              />
              Integral definida
            </label>

            {isDefiniteIntegral && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm text-zinc-400">
                    Limite inferior
                  </label>
                  <input
                    value={lowerBound}
                    onChange={(e) => setLowerBound(e.target.value)}
                    className={fieldClass}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-zinc-400">
                    Limite superior
                  </label>
                  <input
                    value={upperBound}
                    onChange={(e) => setUpperBound(e.target.value)}
                    className={fieldClass}
                    placeholder="1 ou oo"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {selectedOperation === "Limite" && (
          <div className={subCardClass}>
            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                x tende a
              </label>
              <input
                value={limitPoint}
                onChange={(e) => setLimitPoint(e.target.value)}
                className={fieldClass}
                placeholder="0, 2, oo ou -oo"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-zinc-400">Direção</label>
              <select
                value={limitDirection}
                onChange={(e) => setLimitDirection(e.target.value)}
                className={fieldClass}
              >
                <option value="both">Bilateral</option>
                <option value="+">Pela direita (x → a⁺)</option>
                <option value="-">Pela esquerda (x → a⁻)</option>
              </select>
            </div>
          </div>
        )}

        <button
          onClick={onCalculate}
          disabled={loading}
          className="w-full rounded-2xl bg-[#005EB8] px-5 py-4 font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Processando..." : "Calcular"}
        </button>
      </div>
    </div>
  );
}