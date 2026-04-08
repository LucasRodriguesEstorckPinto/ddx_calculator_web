type ResultPanelProps = {
  mode: "calc1" | "calc2";
  expression: string;
  selectedOperation: string;
  variables: string;
};

export function ResultPanel({
  mode,
  expression,
  selectedOperation,
  variables,
}: ResultPanelProps) {
  const safeExpression = expression.trim() || "x^3 - 3*x + 1";

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
        <div className="mt-2 text-base text-white">{safeExpression}</div>
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
            Pronto para cálculo real
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 md:col-span-2">
          <div className="text-sm text-zinc-500">Prévia interpretativa</div>
          <div className="mt-2 text-base leading-7 text-zinc-300">
            A interface já está lendo a expressão digitada e a operação
            selecionada. No próximo passo, vamos conectar isso a um motor
            matemático real para derivadas, integrais, limites, estudo de função
            e análise em duas variáveis.
          </div>
        </div>
      </div>
    </div>
  );
}