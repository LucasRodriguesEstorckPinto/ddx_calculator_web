"use client";

import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
});

type GraphPanelProps = {
  expression: string;
  interval: string;
};

function buildMockSeries(expression: string) {
  const x = Array.from({ length: 241 }, (_, i) => -12 + i * 0.1);

  const normalized = expression.replace(/\s+/g, "").toLowerCase();

  let y = x.map((value) => value ** 3 - 3 * value + 1);

  if (normalized.includes("sin")) {
    y = x.map((value) => Math.sin(value));
  } else if (normalized.includes("cos")) {
    y = x.map((value) => Math.cos(value));
  } else if (normalized.includes("x^2") || normalized.includes("x**2")) {
    y = x.map((value) => value ** 2);
  } else if (normalized.includes("x^4") || normalized.includes("x**4")) {
    y = x.map((value) => value ** 4 - 4 * value ** 2);
  } else if (normalized.includes("1/x")) {
    y = x.map((value) => (Math.abs(value) < 0.2 ? null : 1 / value));
  }

  return { x, y };
}

export function GraphPanel({ expression, interval }: GraphPanelProps) {
  const source = expression.trim() || "x^3 - 3*x + 1";
  const { x, y } = buildMockSeries(source);

  return (
    <div className="glass rounded-[28px] p-6">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm uppercase tracking-[0.2em] text-zinc-500">
            Visualização
          </div>
          <h3 className="mt-3 text-2xl font-semibold text-white">
            Gráfico interativo
          </h3>
        </div>

        <div className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-xs text-zinc-400">
          Intervalo: {interval}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/8 bg-black/30">
        <Plot
          data={[
            {
              x,
              y,
              type: "scatter",
              mode: "lines",
              line: { color: "#39ff14", width: 3 },
              name: source,
            },
          ]}
          layout={{
            autosize: true,
            datarevision: source,
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            font: { color: "#d4d4d8" },
            margin: { l: 40, r: 20, t: 20, b: 40 },
            xaxis: {
              gridcolor: "rgba(255,255,255,0.08)",
              zerolinecolor: "rgba(255,255,255,0.16)",
            },
            yaxis: {
              gridcolor: "rgba(255,255,255,0.08)",
              zerolinecolor: "rgba(255,255,255,0.16)",
            },
          }}
          config={{
            responsive: true,
            displaylogo: false,
          }}
          style={{ width: "100%", height: "380px" }}
          useResizeHandler
        />
      </div>
    </div>
  );
}