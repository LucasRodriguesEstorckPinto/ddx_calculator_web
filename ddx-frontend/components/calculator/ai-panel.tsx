type AiPanelProps = {
  expression: string;
  selectedOperation: string;
};

export function AiPanel({ expression, selectedOperation }: AiPanelProps) {
  return (
    <div className="glass rounded-[28px] p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <div className="text-sm uppercase tracking-[0.2em] text-zinc-500">
            Assistente
          </div>
          <h3 className="mt-3 text-2xl font-semibold text-white">
            Explicação com Gemini
          </h3>
        </div>

        <div className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
          Em breve
        </div>
      </div>

      <div className="rounded-2xl border border-white/8 bg-black/30 p-5">
        <div className="mb-4 rounded-2xl border border-white/6 bg-white/[0.03] p-4">
          <div className="text-sm text-zinc-500">Solicitação atual</div>
          <div className="mt-2 text-sm leading-7 text-zinc-300">
            Explique a operação <span className="text-white">{selectedOperation}</span>{" "}
            aplicada à expressão{" "}
            <span className="text-white">{expression.trim() || "x^3 - 3*x + 1"}</span>,
            descreva o gráfico e interprete o comportamento da função.
          </div>
        </div>

        <p className="text-sm leading-7 text-zinc-400">
          Aqui o Gemini vai explicar o conceito, interpretar o resultado,
          descrever o comportamento do gráfico e responder dúvidas em linguagem
          natural.
        </p>

        <button className="mt-5 rounded-2xl border border-violet-500/20 bg-violet-500/10 px-5 py-3 text-sm font-medium text-violet-300 transition hover:bg-violet-500/15">
          Explicar com Gemini
        </button>
      </div>
    </div>
  );
}