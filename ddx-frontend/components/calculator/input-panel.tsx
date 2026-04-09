"use client";

type InputPanelProps = {
  mode: "calc1" | "calc2";
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
  derivativeOrder: number;
  setDerivativeOrder: (value: number) => void;
  limitPoint: string;
  setLimitPoint: (value: string) => void;
  limitDirection: string;
  setLimitDirection: (value: string) => void;
  partialVariable: string;
  setPartialVariable: (value: string) => void;
  isDefiniteIntegral: boolean;
  setIsDefiniteIntegral: (value: boolean) => void;
  lowerBound: string;
  setLowerBound: (value: string) => void;
  upperBound: string;
  setUpperBound: (value: string) => void;
};

const calc1Operations = [
  "Derivada",
  "Integral",
  "Limite",
  "L'Hôpital",
  "Estudo de Função",
  "Gráfico Interativo",
];

const calc2Operations = [
  "Derivadas Parciais",
  "Gradiente",
  "Plano Tangente",
  "Máximos e Mínimos",
  "Integrais Duplas",
  "Curvas de Nível",
];

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
  isDefiniteIntegral,
  setIsDefiniteIntegral,
  lowerBound,
  setLowerBound,
  upperBound,
  setUpperBound,
}: InputPanelProps) {
  const operations = mode === "calc1" ? calc1Operations : calc2Operations;
  const isLimit = selectedOperation === "Limite";
  const isDerivative = selectedOperation === "Derivada";
  const isPartial = selectedOperation === "Derivadas Parciais";
  const isIntegral = selectedOperation === "Integral";

  return (
    <div className="glass rounded-[28px] p-6">
      <div className="mb-6">
        <div className="text-sm uppercase tracking-[0.2em] text-zinc-500">
          Entrada
        </div>
        <h2 className="mt-3 text-2xl font-semibold text-white">
          Configure o problema
        </h2>
      </div>

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm text-zinc-400">
            Expressão matemática
          </label>
          <textarea
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder={
              mode === "calc1"
                ? "Ex: x**3 - 3*x + 1"
                : "Ex: x**2 + y**2 + 2*x*y"
            }
            className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-[#39ff14]/40"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-400">
            Operação
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {operations.map((item) => {
              const isActive = selectedOperation === item;

              return (
                <button
                  key={item}
                  onClick={() => setSelectedOperation(item)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    isActive
                      ? "border-[#39ff14]/30 bg-[#39ff14]/10 text-white"
                      : "border-white/8 bg-white/[0.03] text-zinc-300 hover:border-[#39ff14]/20 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-zinc-400">
              Variáveis da expressão
            </label>
            <input
              value={variables}
              onChange={(e) => setVariables(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-violet-400/40"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-400">
              Intervalo para gráfico
            </label>
            <input
              value={interval}
              onChange={(e) => setIntervalValue(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-violet-400/40"
            />
          </div>
        </div>

        {isDerivative && (
          <div>
            <label className="mb-2 block text-sm text-zinc-400">
              Ordem da derivada
            </label>
            <input
              type="number"
              min={1}
              value={derivativeOrder}
              onChange={(e) => setDerivativeOrder(Number(e.target.value) || 1)}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-[#39ff14]/40"
            />
          </div>
        )}

        {isIntegral && (
          <div className="space-y-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm text-zinc-400">Tipo de integral</div>
                <div className="text-xs text-zinc-500">
                  Escolha entre integral indefinida ou definida
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDefiniteIntegral(!isDefiniteIntegral)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isDefiniteIntegral
                    ? "bg-[#39ff14] text-black"
                    : "border border-white/10 bg-black/30 text-zinc-300"
                }`}
              >
                {isDefiniteIntegral ? "Definida" : "Indefinida"}
              </button>
            </div>

            {isDefiniteIntegral && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-zinc-400">
                    Limite inferior
                  </label>
                  <input
                    value={lowerBound}
                    onChange={(e) => setLowerBound(e.target.value)}
                    placeholder="Ex: 0"
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-[#39ff14]/40"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-zinc-400">
                    Limite superior
                  </label>
                  <input
                    value={upperBound}
                    onChange={(e) => setUpperBound(e.target.value)}
                    placeholder="Ex: 1, pi, oo"
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-[#39ff14]/40"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {isLimit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                x tende a
              </label>
              <input
                value={limitPoint}
                onChange={(e) => setLimitPoint(e.target.value)}
                placeholder="0, 1, pi, oo, -oo"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-[#39ff14]/40"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Direção
              </label>
              <select
                value={limitDirection}
                onChange={(e) => setLimitDirection(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-violet-400/40"
              >
                <option value="+">Pela direita (+)</option>
                <option value="-">Pela esquerda (-)</option>
              </select>
            </div>
          </div>
        )}

        {isPartial && (
          <div>
            <label className="mb-2 block text-sm text-zinc-400">
              Derivar parcialmente em relação a
            </label>
            <select
              value={partialVariable}
              onChange={(e) => setPartialVariable(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-violet-400/40"
            >
              <option value="x">x</option>
              <option value="y">y</option>
              <option value="z">z</option>
            </select>
          </div>
        )}

        <button
          onClick={onCalculate}
          disabled={loading}
          className="w-full rounded-2xl bg-[#39ff14] px-5 py-4 text-sm font-semibold text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Calculando..." : "Calcular agora"}
        </button>
      </div>
    </div>
  );
}