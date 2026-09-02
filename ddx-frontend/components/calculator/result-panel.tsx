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
  const showSequenceAnalysis = selectedOperation === "Sequências" && !!analysis;
  // ADICIONADO: Flag para indicar a exibição da análise de Séries
  const showSeriesAnalysis = selectedOperation === "Séries" && !!analysis;

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

      {/* RENDERIZAÇÃO ESPECÍFICA PARA SEQUÊNCIAS */}
      {showSequenceAnalysis && (
        <div className="mt-5 space-y-4 rounded-2xl border border-[#39ff14]/20 bg-black/40 p-5 backdrop-blur-md">
          <h4 className="text-lg font-semibold text-[#39ff14]">Análise da Sequência</h4>
          
          <div className="space-y-2 text-sm text-zinc-200">
            <p>
              <strong className="text-zinc-400">Termo Geral (aₙ):</strong>{" "}
              <code className="ml-2 rounded-lg bg-white/10 px-2.5 py-1 font-mono text-white">
                {analysis.general_expression}
              </code>
            </p>
            
            <p>
              <strong className="text-zinc-400">Limite (n → ∞):</strong>{" "}
              <span className="font-mono text-white">
                {String(analysis.limit_infinity).replace("oo", "∞")}
              </span>
            </p>
            
            <p className="mt-2 text-base font-medium text-cyan-400">
              {analysis.status_message}
            </p>
          </div>

          {analysis.first_terms && analysis.first_terms.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/10">
              <h5 className="mb-2 text-xs uppercase tracking-wider text-zinc-400 font-semibold">
                Primeiros Termos Gerados:
              </h5>
              <div className="flex flex-wrap gap-2">
                {analysis.first_terms.map((term: string, index: number) => {
                  const cleanTerm = term.includes("=") ? term.split("=")[1].trim() : term;

                  return (
                    <span
                      key={index}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-zinc-300"
                    >
                      <strong className="text-zinc-500 mr-1">a_{index + 1} =</strong> {cleanTerm}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* RENDERIZAÇÃO ESPECÍFICA PARA SÉRIES */}
      {showSeriesAnalysis && (
        <div className="mt-5 space-y-4 rounded-2xl border border-violet-500/30 bg-black/40 p-5 backdrop-blur-md">
          <h4 className="text-lg font-semibold text-violet-400">Análise da Série Infinita (∑ aₙ)</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-zinc-200">
            <p>
              <strong className="text-zinc-400">Termo Geral (aₙ):</strong>{" "}
              <code className="ml-2 rounded-lg bg-white/10 px-2.5 py-1 font-mono text-white">
                {analysis.general_expression}
              </code>
            </p>

            <p>
              <strong className="text-zinc-400">Soma Infinita (S):</strong>{" "}
              <span className="ml-2 font-mono text-violet-300 font-bold text-base">
                {String(analysis.series_sum).replace("oo", "∞")}
              </span>
            </p>

            <p>
              <strong className="text-zinc-400">Limite lim(aₙ):</strong>{" "}
              <span className="font-mono text-zinc-300">
                {String(analysis.limit_term_general).replace("oo", "∞")}
              </span>
            </p>

            <p>
              <strong className="text-zinc-400">Teste Utilizado:</strong>{" "}
              <span className="text-zinc-300">{analysis.test_used}</span>
            </p>
          </div>

          <p className={`mt-2 text-base font-medium ${analysis.is_convergent ? "text-emerald-400" : "text-amber-400"}`}>
            {analysis.status_message}
          </p>

          {analysis.first_terms && analysis.first_terms.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/10">
              <h5 className="mb-2 text-xs uppercase tracking-wider text-zinc-400 font-semibold">
                Primeiros Termos e Somas Parciais (Sₙ):
              </h5>
              <div className="flex flex-wrap gap-2">
                {analysis.first_terms.map((term: string, index: number) => (
                  <span
                    key={index}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-zinc-300"
                  >
                    {term.replace("oo", "∞")}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showFunctionAnalysis && (
        // ... (Bloco do Estudo de Função mantido sem alterações)
        <div />
      )}
    </div>
  );
}