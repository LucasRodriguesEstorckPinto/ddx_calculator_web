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

type ResultPanelProps = {
  mode: "calc1" | "calc2";
  expression: string;
  selectedOperation: string;
  variables: string;
  computedResult: string;
  error: string;
  analysis?: AnalysisResult;
};

function renderList(items?: string[]) {
  if (!items || items.length === 0) return "Nenhum";
  return items.join(", ");
}

export function ResultPanel({
  mode,
  expression,
  selectedOperation,
  variables,
  computedResult,
  error,
  analysis,
}: ResultPanelProps) {
  const safeExpression = expression.trim() || "x**3 - 3*x + 1";
  const showFunctionAnalysis =
    selectedOperation === "Estudo de Função" && !!analysis;

  return (
    <div className="glass rounded-[28px] p-6">
      <div className="mb-5">
        <div className="text-sm uppercase tracking-[0.2em] text-zinc-500">
          Resultado
        </div>
        <h3 className="mt-3 text-2xl font-semibold text-white">
          {mode === "calc1" ? "Análise da função" : "Análise multivariável"}
        </h3>
      </div>

      <div className="mb-5 rounded-2xl border border-white/8 bg-black/30 p-4">
        <div className="text-sm text-zinc-500">Expressão atual</div>
        <div className="mt-2 break-words text-base text-white">
          {safeExpression}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <div className="text-sm text-zinc-500">Modo</div>
          <div className="mt-2 text-lg font-medium text-white">
            {mode === "calc1" ? "Cálculo 1" : "Cálculo 2"}
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <div className="text-sm text-zinc-500">Operação</div>
          <div className="mt-2 text-lg font-medium text-white">
            {selectedOperation}
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <div className="text-sm text-zinc-500">Variáveis</div>
          <div className="mt-2 text-lg font-medium text-white">
            {variables}
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <div className="text-sm text-zinc-500">Status</div>
          <div className="mt-2 text-lg font-medium text-white">
            {error ? "Erro" : "Calculado"}
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 md:col-span-2">
          <div className="text-sm text-zinc-500">Resultado simbólico</div>
          <div className="mt-2 break-words text-base leading-7 text-white">
            {error || computedResult}
          </div>
        </div>
      </div>

      {showFunctionAnalysis && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 md:col-span-2">
            <div className="text-sm text-zinc-500">Resumo da análise</div>
            <div className="mt-2 text-base leading-7 text-white">
              {analysis?.mode_message || "Estudo de função básico calculado."}
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 md:col-span-2">
            <div className="text-sm text-zinc-500">Domínio</div>
            <div className="mt-2 break-words text-base text-white">
              {analysis?.domain || "Não informado"}
            </div>
            <div className="mt-2 text-sm text-zinc-400">
              Intervalos: {renderList(analysis?.domain_intervals)}
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className="text-sm text-zinc-500">f'(x)</div>
            <div className="mt-2 break-words text-base text-white">
              {analysis?.first_derivative || "Não calculado"}
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className="text-sm text-zinc-500">f''(x)</div>
            <div className="mt-2 break-words text-base text-white">
              {analysis?.second_derivative || "Não calculado"}
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className="text-sm text-zinc-500">Pontos críticos</div>
            <div className="mt-2 break-words text-base text-white">
              {renderList(analysis?.critical_points)}
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className="text-sm text-zinc-500">Pontos estacionários</div>
            <div className="mt-2 break-words text-base text-white">
              {renderList(analysis?.stationary_points)}
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className="text-sm text-zinc-500">Candidatos a inflexão</div>
            <div className="mt-2 break-words text-base text-white">
              {renderList(analysis?.inflection_candidates)}
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className="text-sm text-zinc-500">Singularidades</div>
            <div className="mt-2 break-words text-base text-white">
              {renderList(analysis?.singularities)}
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className="text-sm text-zinc-500">Máximos locais</div>
            <div className="mt-2 break-words text-base text-white">
              {renderList(analysis?.local_maxima)}
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className="text-sm text-zinc-500">Mínimos locais</div>
            <div className="mt-2 break-words text-base text-white">
              {renderList(analysis?.local_minima)}
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 md:col-span-2">
            <div className="text-sm text-zinc-500">Crescimento</div>
            <div className="mt-2 break-words text-base text-white">
              Crescente: {renderList(analysis?.increasing_intervals)}
            </div>
            <div className="mt-2 break-words text-base text-white">
              Decrescente: {renderList(analysis?.decreasing_intervals)}
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 md:col-span-2">
            <div className="text-sm text-zinc-500">Concavidade</div>
            <div className="mt-2 break-words text-base text-white">
              Côncava para cima: {renderList(analysis?.concave_up_intervals)}
            </div>
            <div className="mt-2 break-words text-base text-white">
              Côncava para baixo: {renderList(analysis?.concave_down_intervals)}
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 md:col-span-2">
            <div className="text-sm text-zinc-500">Assíntotas verticais</div>
            <div className="mt-2 break-words text-base text-white">
              {renderList(analysis?.vertical_asymptotes)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}