"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { CalcTabs } from "@/components/calculator/calc-tabs";
import { InputPanel } from "@/components/calculator/input-panel";
import { ResultPanel } from "@/components/calculator/result-panel";
import { GraphPanel } from "@/components/calculator/graph-panel";
import { AiPanel } from "@/components/calculator/ai-panel";
import { HistoryPanel } from "@/components/calculator/history-panel";
import {
  calculateMath,
  type AnalysisResult,
  type CalcMode,
  type CalcStep,
} from "@/lib/math-api";
import {
  addHistoryEntry,
  type HistoryEntry,
  type HistoryParams,
} from "@/lib/history";

const EMPTY_MATRIX = JSON.stringify([
  ["", "", ""],
  ["", "", ""],
  ["", "", ""],
]);

const IDLE_MESSAGE = "Ainda não calculado";

export function CalculatorShell() {
  const [mode, setMode] = useState<CalcMode>("alglin");

  const [expression, setExpression] = useState(EMPTY_MATRIX);
  const [selectedOperation, setSelectedOperation] = useState("Escalonamento");
  const [variables, setVariables] = useState("");

  const [interval, setIntervalValue] = useState("[-10, 10]");
  const [result, setResult] = useState(IDLE_MESSAGE);
  const [latex, setLatex] = useState("");
  const [steps, setSteps] = useState<CalcStep[]>([]);
  const [hasResult, setHasResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult>(null);

  const [derivativeOrder, setDerivativeOrder] = useState(1);
  const [limitPoint, setLimitPoint] = useState("0");
  const [limitDirection, setLimitDirection] = useState("both");
  const [tangentPoint, setTangentPoint] = useState("0");

  const [isDefiniteIntegral, setIsDefiniteIntegral] = useState(false);
  const [lowerBound, setLowerBound] = useState("0");
  const [upperBound, setUpperBound] = useState("1");

  const status = error ? "error" : hasResult ? "success" : "idle";

  function resetOutput() {
    setResult(IDLE_MESSAGE);
    setLatex("");
    setSteps([]);
    setHasResult(false);
    setError("");
    setAnalysis(null);
  }

  function describeError(err: unknown) {
    if (err instanceof Error) {
      if (err.message === "TIMEOUT") {
        return "O backend demorou demais para responder.";
      }
      if (err.message.startsWith("HTTP_")) {
        return `Erro do servidor: ${err.message.replace("HTTP_", "")}`;
      }
      if (err.message.startsWith("INVALID_JSON:")) {
        console.error(err.message);
        return "O backend respondeu, mas o JSON veio inválido.";
      }
    }
    return "Não foi possível conectar ao backend matemático.";
  }

  // Recebe os valores explicitamente para poder ser chamada logo após restaurar o histórico
  async function runCalculation(
    calcMode: CalcMode,
    operation: string,
    params: HistoryParams
  ) {
    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const variable = params.variables.split(",")[0].trim() || "x";

      const data = await calculateMath({
        mode: calcMode,
        expression: params.expression,
        operation,
        variable,
        point: operation === "Reta Tangente" ? params.tangentPoint : params.limitPoint,
        direction: params.limitDirection,
        order: params.derivativeOrder,
        definite_integral: params.isDefiniteIntegral,
        lower_bound: params.lowerBound,
        upper_bound: params.upperBound,
      });

      if (!data.success) {
        setError(data.error || "Erro ao calcular");
        setResult("Falha no cálculo");
        setLatex("");
        setSteps([]);
        setHasResult(false);
        setAnalysis(null);
        return;
      }

      setResult(data.result || "Calculado");
      setLatex(data.latex);
      setSteps(data.steps);
      setAnalysis(data.analysis);
      setHasResult(true);

      addHistoryEntry({
        mode: calcMode,
        operation,
        params,
        result: data.result || "Calculado",
        latex: data.latex,
      });
    } catch (err) {
      setError(describeError(err));
      setResult("Falha no cálculo");
      setLatex("");
      setSteps([]);
      setHasResult(false);
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  }

  function currentParams(): HistoryParams {
    return {
      expression,
      variables,
      derivativeOrder,
      limitPoint,
      limitDirection,
      tangentPoint,
      isDefiniteIntegral,
      lowerBound,
      upperBound,
    };
  }

  function handleCalculate() {
    void runCalculation(mode, selectedOperation, currentParams());
  }

  function handleOperationChange(operation: string) {
    setSelectedOperation(operation);
    // O resultado antigo não pertence mais à operação escolhida
    resetOutput();
  }

  function handleModeChange(nextMode: CalcMode) {
    setMode(nextMode);

    if (nextMode === "alglin") {
      setExpression(EMPTY_MATRIX);
      setSelectedOperation("Escalonamento");
      setVariables("");
    } else {
      setExpression("x**3 - 3*x + 1");
      setSelectedOperation("Derivada");
      setVariables("x");
    }

    setDerivativeOrder(1);
    setLimitPoint("0");
    setLimitDirection("both");
    setTangentPoint("0");
    setIsDefiniteIntegral(false);
    setLowerBound("0");
    setUpperBound("1");
    resetOutput();
  }

  function handleRestore(entry: HistoryEntry) {
    const { params } = entry;

    setMode(entry.mode);
    setSelectedOperation(entry.operation);
    setExpression(params.expression);
    setVariables(params.variables);
    setDerivativeOrder(params.derivativeOrder);
    setLimitPoint(params.limitPoint);
    setLimitDirection(params.limitDirection);
    setTangentPoint(params.tangentPoint);
    setIsDefiniteIntegral(params.isDefiniteIntegral);
    setLowerBound(params.lowerBound);
    setUpperBound(params.upperBound);
    resetOutput();

    void runCalculation(entry.mode, entry.operation, params);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_10%,rgba(0,94,184,0.12),transparent_18%),radial-gradient(circle_at_50%_50%,rgba(0,94,184,0.10),transparent_18%),radial-gradient(circle_at_80%_18%,rgba(0,94,184,0.12),transparent_18%),linear-gradient(to_bottom,#050505,#040404)] text-white">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="container-ddx flex h-20 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
            >
              <ArrowLeft size={16} />
              Voltar
            </Link>

            <div>
              <div className="text-2xl font-bold tracking-tight">
                <span className="text-white">D</span>
                <span className="text-[#005EB8]">D</span>
                <span className="text-white">X</span>
              </div>
              <div className="text-xs text-zinc-500">
                Interactive Math Workspace
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-3 rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300 md:flex">
            <Sparkles size={16} className="text-[#005EB8]" />
            IA explicativa integrada
          </div>
        </div>
      </header>

      <main className="container-ddx py-10">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-zinc-500">
              Workspace
            </div>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Ferramenta de <span className="text-[#005EB8]">matemática</span>{" "}
              com análise, gráfico e explicação
            </h1>
            <p className="mt-4 max-w-2xl text-zinc-400">
              Resolva matrizes, acompanhe o passo a passo, visualize funções e
              interprete resultados em uma interface única.
            </p>
          </div>

          <CalcTabs value={mode} onChange={handleModeChange} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <div className="space-y-6">
            <InputPanel
              mode={mode}
              expression={expression}
              setExpression={setExpression}
              selectedOperation={selectedOperation}
              setSelectedOperation={handleOperationChange}
              variables={variables}
              setVariables={setVariables}
              interval={interval}
              setIntervalValue={setIntervalValue}
              onCalculate={handleCalculate}
              loading={loading}
              derivativeOrder={derivativeOrder}
              setDerivativeOrder={setDerivativeOrder}
              limitPoint={limitPoint}
              setLimitPoint={setLimitPoint}
              limitDirection={limitDirection}
              setLimitDirection={setLimitDirection}
              tangentPoint={tangentPoint}
              setTangentPoint={setTangentPoint}
              isDefiniteIntegral={isDefiniteIntegral}
              setIsDefiniteIntegral={setIsDefiniteIntegral}
              lowerBound={lowerBound}
              setLowerBound={setLowerBound}
              upperBound={upperBound}
              setUpperBound={setUpperBound}
            />

            <HistoryPanel onRestore={handleRestore} />
          </div>

          <div className="space-y-6">
            <ResultPanel
              mode={mode}
              expression={expression}
              selectedOperation={selectedOperation}
              status={status}
              computedResult={result}
              latex={latex}
              steps={steps}
              error={error}
              analysis={analysis}
            />

            {}
            {mode === "calc1" && (
              <GraphPanel
                expression={expression}
                interval={interval}
                analysis={analysis}
                selectedOperation={selectedOperation}
                tangentPoint={tangentPoint}
              />
            )}

            <AiPanel
              expression={expression}
              selectedOperation={selectedOperation}
              result={{
                computedResult: result,
                analysis,
                error,
                mode,
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}