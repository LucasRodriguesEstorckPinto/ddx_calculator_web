"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { CalcTabs } from "@/components/calculator/calc-tabs";
import { InputPanel } from "@/components/calculator/input-panel";
import { ResultPanel } from "@/components/calculator/result-panel";
import { GraphPanel } from "@/components/calculator/graph-panel";
import { AiPanel } from "@/components/calculator/ai-panel";
import { calculateMath } from "@/lib/math-api";

type AnalysisResult = {
  mode_message?: string;
  domain?: string;
  domain_intervals?: string[];
  first_derivative?: string;
  second_derivative?: string;
  critical_points?: string[];
  stationary_points?: string[];
  inflection_candidates?: string[];
  singularities?: string[];
  increasing_intervals?: string[];
  decreasing_intervals?: string[];
  concave_up_intervals?: string[];
  concave_down_intervals?: string[];
  local_maxima?: string[];
  local_minima?: string[];
  vertical_asymptotes?: string[];
} | null;

export function CalculatorShell() {
  const [mode, setMode] = useState<"calc1" | "calc2">("calc1");
  const [expression, setExpression] = useState("x**3 - 3*x + 1");
  const [selectedOperation, setSelectedOperation] = useState("Derivada");
  const [variables, setVariables] = useState("x");
  const [interval, setIntervalValue] = useState("[-10, 10]");
  const [result, setResult] = useState("Ainda não calculado");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult>(null);

  const [derivativeOrder, setDerivativeOrder] = useState(1);
  const [limitPoint, setLimitPoint] = useState("0");
  const [limitDirection, setLimitDirection] = useState("+");
  const [partialVariable, setPartialVariable] = useState("x");
  const [tangentPoint, setTangentPoint] = useState("0");

  const [isDefiniteIntegral, setIsDefiniteIntegral] = useState(false);
  const [lowerBound, setLowerBound] = useState("0");
  const [upperBound, setUpperBound] = useState("1");

  async function handleCalculate() {
    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      let variable = variables.split(",")[0].trim() || "x";

      if (selectedOperation === "Derivadas Parciais") {
        variable = partialVariable;
      }

      const data = await calculateMath({
        expression,
        operation: selectedOperation,
        variable,
        point: limitPoint,
        direction: limitDirection,
        order: derivativeOrder,
        definite_integral: isDefiniteIntegral,
        lower_bound: lowerBound,
        upper_bound: upperBound,
      });

      if (!data.success) {
        setError(data.error || "Erro ao calcular");
        setResult("Falha no cálculo");
        setAnalysis(null);
      } else {
        setResult(data.result || "Calculado");
        setAnalysis(data.analysis || null);
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "TIMEOUT") {
          setError("O backend demorou demais para responder.");
        } else if (err.message.startsWith("HTTP_")) {
          setError(`Erro do servidor: ${err.message.replace("HTTP_", "")}`);
        } else if (err.message.startsWith("INVALID_JSON:")) {
          setError("O backend respondeu, mas o JSON veio inválido.");
          console.error(err.message);
        } else {
          setError("Não foi possível conectar ao backend matemático.");
        }
      } else {
        setError("Não foi possível conectar ao backend matemático.");
      }

      setResult("Falha no cálculo");
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_10%,rgba(57,255,20,0.12),transparent_18%),radial-gradient(circle_at_80%_18%,rgba(139,92,246,0.12),transparent_18%),linear-gradient(to_bottom,#050505,#040404)] text-white">
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
                <span className="text-[#39ff14]">D</span>
                <span className="text-white">X</span>
              </div>
              <div className="text-xs text-zinc-500">
                Interactive Calculus Workspace
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-3 rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300 md:flex">
            <Sparkles size={16} className="text-violet-400" />
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
              Ferramenta de <span className="text-[#39ff14]">Cálculo</span> com
              análise, gráfico e explicação
            </h1>
            <p className="mt-4 max-w-2xl text-zinc-400">
              Resolva expressões, visualize curvas, interprete resultados e
              explore conceitos de Cálculo 1 e Cálculo 2 em uma interface única.
            </p>
          </div>

          <CalcTabs
            value={mode}
            onChange={(nextMode) => {
              setMode(nextMode);

              if (nextMode === "calc1") {
                setExpression("x**3 - 3*x + 1");
                setSelectedOperation("Derivada");
                setVariables("x");
              } else {
                setExpression("x**2 + y**2 + 2*x*y");
                setSelectedOperation("Derivadas Parciais");
                setVariables("x, y");
              }

              setDerivativeOrder(1);
              setLimitPoint("0");
              setLimitDirection("+");
              setPartialVariable("x");
              setTangentPoint("0");
              setIsDefiniteIntegral(false);
              setLowerBound("0");
              setUpperBound("1");
              setResult("Ainda não calculado");
              setError("");
              setAnalysis(null);
            }}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <InputPanel
            mode={mode}
            expression={expression}
            setExpression={setExpression}
            selectedOperation={selectedOperation}
            setSelectedOperation={setSelectedOperation}
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
            partialVariable={partialVariable}
            setPartialVariable={setPartialVariable}
            tangentPoint={tangentPoint}
            setTangentPoint={setTangentPoint}
            isDefiniteIntegral={isDefiniteIntegral}
            setIsDefiniteIntegral={setIsDefiniteIntegral}
            lowerBound={lowerBound}
            setLowerBound={setLowerBound}
            upperBound={upperBound}
            setUpperBound={setUpperBound}
          />

          <div className="space-y-6">
            <ResultPanel
              mode={mode}
              expression={expression}
              selectedOperation={selectedOperation}
              variables={
                selectedOperation === "Derivadas Parciais"
                  ? partialVariable
                  : variables
              }
              computedResult={result}
              error={error}
              analysis={analysis}
            />
            <GraphPanel
              expression={expression}
              interval={interval}
              analysis={analysis}
              selectedOperation={selectedOperation}
              tangentPoint={tangentPoint}
            />
            <AiPanel
              expression={expression}
              selectedOperation={selectedOperation}
            />
          </div>
        </div>
      </main>
    </div>
  );
}