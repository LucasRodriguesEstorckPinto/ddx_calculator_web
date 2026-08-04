// Mantenha suas tipagens de AnalysisResult...

type CalcMode = "alglin" | "calc1" | "calc2";

type ResultPanelProps = {
  mode: CalcMode;
  expression: string;
  selectedOperation: string;
  variables: string;
  computedResult: string;
  error: string;
  analysis?: any; // Substitua pelo seu tipo AnalysisResult
};

export function ResultPanel({
  mode,
  expression,
  selectedOperation,
  variables,
  computedResult,
  error,
  analysis,
}: ResultPanelProps) {
  const safeExpression = expression.trim() || (mode === "alglin" ? "[[1, 2], [3, 4]]" : "x**3 - 3*x + 1");
  const showFunctionAnalysis = selectedOperation === "Estudo de Função" && !!analysis;

  const getModeTitle = () => {
    switch (mode) {
      case "alglin": return "Análise Matricial e Vetorial";
      case "calc1": return "Análise da Função";
      case "calc2": return "Análise Multivariável";
      default: return "Resultado";
    }
  };

  return (
    <div className="glass rounded-[28px] p-6">
      <div className="mb-5">
        <div className="text-sm uppercase tracking-[0.2em] text-zinc-500">
          Resultado
        </div>
        <h3 className="mt-3 text-2xl font-semibold text-white">
          {getModeTitle()}
        </h3>
      </div>

      <div className="mb-5 rounded-2xl border border-white/8 bg-black/30 p-4">
        <div className="text-sm text-zinc-500">
          {mode === "alglin" ? "Dados de Entrada" : "Expressão atual"}
        </div>
        <div className="mt-2 break-words text-base text-white font-mono">
          {safeExpression}
        </div>
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
          <div className="mt-2 text-lg font-medium text-white">
            {error ? "Erro" : "Processado"}
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 md:col-span-2">
          <div className="text-sm text-zinc-500">Resultado da Operação</div>
          <div className="mt-2 break-words text-base leading-7 text-white font-mono whitespace-pre-wrap">
            {error || computedResult}
          </div>
        </div>
      </div>

      {showFunctionAnalysis && (
          // ... (Manter o bloco existente do Estudo de Função)
          <div />
      )}
    </div>
  );
}