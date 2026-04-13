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
  const calc1Operations = ["Derivada", "Integral", "Limite", "Estudo de Função"];
  const calc2Operations = ["Derivadas Parciais", "Integral"];

  const operations = mode === "calc1" ? calc1Operations : calc2Operations;

  return (
    <div className="glass rounded-[28px] p-6">
      <div className="mb-5">
        <div className="text-sm uppercase tracking-[0.2em] text-zinc-500">
          Entrada
        </div>
        <h3 className="mt-3 text-2xl font-semibold text-white">
          Configuração do cálculo
        </h3>
      </div>

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm text-zinc-400">Expressão</label>
          <textarea
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            className="min-h-[140px] w-full rounded-2xl border border-white/8 bg-black/30 px-4 py-4 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-[#39ff14]/40"
            placeholder="Ex.: x**3 - 3*x + 1"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-400">Operação</label>
          <select
            value={selectedOperation}
            onChange={(e) => setSelectedOperation(e.target.value)}
            className="w-full rounded-2xl border border-white/8 bg-black/30 px-4 py-4 text-white outline-none transition focus:border-[#39ff14]/40"
          >
            {operations.map((operation) => (
              <option key={operation} value={operation}>
                {operation}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-400">Variáveis</label>
          <input
            value={variables}
            onChange={(e) => setVariables(e.target.value)}
            className="w-full rounded-2xl border border-white/8 bg-black/30 px-4 py-4 text-white outline-none transition focus:border-[#39ff14]/40"
            placeholder={mode === "calc1" ? "x" : "x, y"}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-400">Intervalo do gráfico</label>
          <input
            value={interval}
            onChange={(e) => setIntervalValue(e.target.value)}
            className="w-full rounded-2xl border border-white/8 bg-black/30 px-4 py-4 text-white outline-none transition focus:border-[#39ff14]/40"
            placeholder="[-10, 10]"
          />
        </div>

        {selectedOperation === "Derivada" && (
          <div className="space-y-5 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Ordem da derivada
              </label>
              <input
                type="number"
                min={1}
                value={derivativeOrder}
                onChange={(e) => setDerivativeOrder(Number(e.target.value))}
                className="w-full rounded-2xl border border-white/8 bg-black/30 px-4 py-4 text-white outline-none transition focus:border-[#39ff14]/40"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Ponto da tangente
              </label>
              <input
                value={tangentPoint}
                onChange={(e) => setTangentPoint(e.target.value)}
                className="w-full rounded-2xl border border-white/8 bg-black/30 px-4 py-4 text-white outline-none transition focus:border-[#39ff14]/40"
                placeholder="Ex.: 1"
              />
            </div>
          </div>
        )}

        {selectedOperation === "Limite" && (
          <div className="space-y-5 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <div>
              <label className="mb-2 block text-sm text-zinc-400">Ponto</label>
              <input
                value={limitPoint}
                onChange={(e) => setLimitPoint(e.target.value)}
                className="w-full rounded-2xl border border-white/8 bg-black/30 px-4 py-4 text-white outline-none transition focus:border-[#39ff14]/40"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-400">Direção</label>
              <select
                value={limitDirection}
                onChange={(e) => setLimitDirection(e.target.value)}
                className="w-full rounded-2xl border border-white/8 bg-black/30 px-4 py-4 text-white outline-none transition focus:border-[#39ff14]/40"
              >
                <option value="+">Pela direita (+)</option>
                <option value="-">Pela esquerda (-)</option>
              </select>
            </div>
          </div>
        )}

        {selectedOperation === "Derivadas Parciais" && (
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <label className="mb-2 block text-sm text-zinc-400">
              Variável da derivada parcial
            </label>
            <input
              value={partialVariable}
              onChange={(e) => setPartialVariable(e.target.value)}
              className="w-full rounded-2xl border border-white/8 bg-black/30 px-4 py-4 text-white outline-none transition focus:border-[#39ff14]/40"
              placeholder="x"
            />
          </div>
        )}

        {selectedOperation === "Integral" && (
          <div className="space-y-5 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <label className="flex items-center gap-3 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={isDefiniteIntegral}
                onChange={(e) => setIsDefiniteIntegral(e.target.checked)}
              />
              Integral definida
            </label>

            {isDefiniteIntegral && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-zinc-400">
                    Limite inferior
                  </label>
                  <input
                    value={lowerBound}
                    onChange={(e) => setLowerBound(e.target.value)}
                    className="w-full rounded-2xl border border-white/8 bg-black/30 px-4 py-4 text-white outline-none transition focus:border-[#39ff14]/40"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-zinc-400">
                    Limite superior
                  </label>
                  <input
                    value={upperBound}
                    onChange={(e) => setUpperBound(e.target.value)}
                    className="w-full rounded-2xl border border-white/8 bg-black/30 px-4 py-4 text-white outline-none transition focus:border-[#39ff14]/40"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={onCalculate}
          disabled={loading}
          className="w-full rounded-2xl bg-[#39ff14] px-5 py-4 font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Calculando..." : "Calcular"}
        </button>
      </div>
    </div>
  );
}