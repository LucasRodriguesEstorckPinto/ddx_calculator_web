"use client";

import { useState, useEffect } from "react";

type CalcMode = "alglin" | "calc1" | "calc2";

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
  // Props de Cálculo 1 e 2
  derivativeOrder: number;
  setDerivativeOrder: (value: number) => void;
  limitPoint: string;
  setLimitPoint: (value: string) => void;
  limitDirection: string;
  setLimitDirection: (value: string) => void;
  partialVariable: string;
  setPartialVariable: (value: string) => void;
  tangentPoint: string;
  setTangentPoint: (value: string) => void;
  isDefiniteIntegral: boolean;
  setIsDefiniteIntegral: (value: boolean) => void;
  lowerBound: string;
  setLowerBound: (value: string) => void;
  upperBound: string;
  setUpperBound: (value: string) => void;
};

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
  partialVariable,
  setPartialVariable,
  tangentPoint,
  setTangentPoint,
  isDefiniteIntegral,
  setIsDefiniteIntegral,
  lowerBound,
  setLowerBound,
  upperBound,
  setUpperBound,
}: InputPanelProps) {
  const algLinOperations = ["Determinante", "Matriz Inversa", "Escalonamento", "Autovalores e Autovetores", "Sistema Linear"];
  const calc1Operations = ["Derivada", "Integral", "Limite", "Estudo de Função"];
  // ADICIONADO: "Séries" na lista de operações do Cálculo 2
  const calc2Operations = ["Derivadas Parciais", "Integral Dupla", "Sequências", "Séries"];

  const operations = 
    mode === "alglin" ? algLinOperations :
    mode === "calc1" ? calc1Operations : 
    calc2Operations;
  
  // Trata a troca de operações no Select
  const handleOperationChange = (newOperation: string) => {
    setSelectedOperation(newOperation);

    // Se o usuário mudou para "Sequências", aplica o exemplo e a variável 'n'
    if (newOperation === "Sequências") {
      setExpression("[3, 7, 11, 15, 19]");
      setVariables("n");
    } 
    // ADICIONADO: Se o usuário mudou para "Séries", aplica um exemplo convergente e variável 'n'
    else if (newOperation === "Séries") {
      setExpression("(1/2)^n");
      setVariables("n");
    }
    // Se o usuário estava em Sequências/Séries e mudou para outra operação do Calc 2, restaura o padrão
    else if (selectedOperation === "Sequências" || selectedOperation === "Séries") {
      setExpression("x**2 + y**2 + 2*x*y");
      setVariables("x, y");
    }
  };

  // Estados locais para controlar a grade da matriz em Álgebra Linear
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [matrix, setMatrix] = useState<string[][]>(
    Array(3).fill("").map(() => Array(3).fill(""))
  );

  // Quando o usuário alterar o tamanho, ajustamos a matriz mantendo os valores existentes
  const handleDimensionChange = (newRows: number, newCols: number) => {
    const newMatrix = Array(newRows).fill("").map((_, r) => 
      Array(newCols).fill("").map((_, c) => 
        (r < rows && c < cols) ? matrix[r][c] : ""
      )
    );
    setRows(newRows);
    setCols(newCols);
    setMatrix(newMatrix);
  };

  const handleCellChange = (r: number, c: number, value: string) => {
    const newMatrix = matrix.map((row, rowIndex) =>
      row.map((cell, colIndex) => (rowIndex === r && colIndex === c ? value : cell))
    );
    setMatrix(newMatrix);
  };

  // Sincroniza a grade visual com a prop 'expression' que vai para o backend
  useEffect(() => {
    if (mode === "alglin") {
      setExpression(JSON.stringify(matrix));
    }
  }, [matrix, mode, setExpression]);

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
            onChange={(e) => handleOperationChange(e.target.value)}
            className="w-full rounded-2xl border border-white/8 bg-black/30 px-4 py-4 text-white outline-none transition focus:border-[#005EB8]/40"
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
          <div className="space-y-4 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-zinc-400">Dimensões da Matriz</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" min={1} max={6} value={rows} 
                  onChange={(e) => handleDimensionChange(Number(e.target.value) || 1, cols)}
                  className="w-12 rounded-lg bg-black/40 p-1 text-center text-white border border-white/10"
                />
                <span className="text-zinc-500">x</span>
                <input 
                  type="number" min={1} max={6} value={cols} 
                  onChange={(e) => handleDimensionChange(rows, Number(e.target.value) || 1)}
                  className="w-12 rounded-lg bg-black/40 p-1 text-center text-white border border-white/10"
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
                      onChange={(e) => handleCellChange(r, c, e.target.value)}
                      className="w-full min-w-[50px] rounded-xl border border-white/10 bg-black/30 p-3 text-center text-white outline-none transition focus:border-[#005EB8]/50"
                      placeholder="0"
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label className="mb-2 block text-sm text-zinc-400">Expressão</label>
            <textarea
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              className="min-h-[140px] w-full rounded-2xl border border-white/8 bg-black/30 px-4 py-4 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-[#005EB8]/40"
              placeholder={
                selectedOperation === "Sequências"
                  ? "Ex.: [3, 7, 11, 15, 19] ou (2*n + 1)/(n + 2)"
                  : selectedOperation === "Séries"
                  ? "Ex.: (1/2)^n ou 1/(n**2) ou 1/n"
                  : "Ex.: x**3 - 3*x + 1"
              }
            />
          </div>
        )}

        {/* CAMPOS DE VARIÁVEIS E INTERVALO PARA CÁLCULO 1 E 2 */}
        {mode !== "alglin" && (
          <>
            <div>
              <label className="mb-2 block text-sm text-zinc-400">Variáveis</label>
              <input
                value={variables}
                onChange={(e) => setVariables(e.target.value)}
                className="w-full rounded-2xl border border-white/8 bg-black/30 px-4 py-4 text-white outline-none transition focus:border-[#005EB8]/40"
                placeholder={
                  selectedOperation === "Sequências" || selectedOperation === "Séries"
                    ? "n"
                    : mode === "calc1"
                    ? "x"
                    : "x, y"
                }
              />
            </div>

            {/* Oculta o intervalo do gráfico para "Sequências" e "Séries" */}
            {selectedOperation !== "Sequências" && selectedOperation !== "Séries" && (
              <div>
                <label className="mb-2 block text-sm text-zinc-400">Intervalo do gráfico</label>
                <input
                  value={interval}
                  onChange={(e) => setIntervalValue(e.target.value)}
                  className="w-full rounded-2xl border border-white/8 bg-black/30 px-4 py-4 text-white outline-none transition focus:border-[#005EB8]/40"
                  placeholder="[-10, 10]"
                />
              </div>
            )}
          </>
        )}

        {selectedOperation === "Derivada" && (
           <div className="space-y-5 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
             {
             }
           </div>
        )}

        <button
          onClick={onCalculate}
          disabled={loading}
          className={`w-full rounded-2xl px-5 py-4 font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70 ${
            mode === "alglin" ? "bg-[#005EB8]" : mode === "calc1" ? "bg-[#005EB8]" : "bg-[#005EB8] text-white"
          }`}
        >
          {loading ? "Processando..." : "Calcular"}
        </button>
      </div>
    </div>
  );
}