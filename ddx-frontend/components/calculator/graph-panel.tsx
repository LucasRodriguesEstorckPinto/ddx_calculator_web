"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { compile, derivative, evaluate } from "mathjs";
import type { Data, Layout } from "plotly.js";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
});

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

type GraphPanelProps = {
  expression: string;
  interval: string;
  analysis?: AnalysisResult;
  selectedOperation?: string;
  tangentPoint?: string;
};

type ParsedPoint = {
  x: number;
  y: number;
};

type FunctionSeries = {
  x: number[];
  y: Array<number | null>;
  parseError: string | null;
};

type TangentData = {
  pointX: number;
  pointY: number;
  slope: number;
  lineX: number[];
  lineY: number[];
} | null;

function parseInterval(interval: string): [number, number] {
  try {
    const cleaned = interval.replace(/\[|\]/g, "");
    const [a, b] = cleaned.split(",").map((v) => Number(v.trim()));

    if (Number.isFinite(a) && Number.isFinite(b) && a < b) {
      return [a, b];
    }

    return [-10, 10];
  } catch {
    return [-10, 10];
  }
}

function normalizeExpressionForMathJS(expression: string) {
  return expression
    .trim()
    .replace(/\*\*/g, "^")
    .replace(/\boo\b/g, "Infinity")
    .replace(/∞/g, "Infinity");
}

function isExpressionLikelyIncomplete(expression: string) {
  const exp = expression.trim();

  if (!exp) return true;
  if (/[\+\-\*\/\^,(]$/.test(exp)) return true;

  let balance = 0;

  for (const char of exp) {
    if (char === "(") balance += 1;
    if (char === ")") balance -= 1;
    if (balance < 0) return true;
  }

  return balance !== 0;
}

function buildFunctionSeries(
  expression: string,
  minX: number,
  maxX: number
): FunctionSeries {
  const normalizedExpression = normalizeExpressionForMathJS(expression);

  if (!normalizedExpression) {
    return {
      x: [],
      y: [],
      parseError: "Expressão vazia.",
    };
  }

  if (isExpressionLikelyIncomplete(normalizedExpression)) {
    return {
      x: [],
      y: [],
      parseError: "Expressão incompleta. Termine de digitar para visualizar.",
    };
  }

  let compiledExpression: ReturnType<typeof compile>;

  try {
    compiledExpression = compile(normalizedExpression);
  } catch (error) {
    return {
      x: [],
      y: [],
      parseError:
        error instanceof Error
          ? error.message
          : "Não foi possível interpretar a expressão.",
    };
  }

  const x: number[] = [];
  const y: Array<number | null> = [];
  const step = (maxX - minX) / 240;

  for (let value = minX; value <= maxX; value += step) {
    try {
      const result = compiledExpression.evaluate({ x: value });

      if (
        typeof result === "number" &&
        Number.isFinite(result) &&
        Math.abs(result) < 1e6
      ) {
        x.push(value);
        y.push(result);
      } else {
        x.push(value);
        y.push(null);
      }
    } catch {
      x.push(value);
      y.push(null);
    }
  }

  return {
    x,
    y,
    parseError: null,
  };
}

function parsePointString(point: string): ParsedPoint | null {
  try {
    const cleaned = point.trim().replace(/^\(/, "").replace(/\)$/, "");
    const commaIndex = cleaned.indexOf(",");

    if (commaIndex === -1) return null;

    const xStr = normalizeExpressionForMathJS(
      cleaned.slice(0, commaIndex).trim()
    );
    const yStr = normalizeExpressionForMathJS(
      cleaned.slice(commaIndex + 1).trim()
    );

    const x = Number(evaluate(xStr));
    const y = Number(evaluate(yStr));

    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

    return { x, y };
  } catch {
    return null;
  }
}

function getTangentData(
  expression: string,
  tangentPoint?: string,
  minX?: number,
  maxX?: number
): TangentData {
  if (!tangentPoint) return null;
  if (!Number.isFinite(minX) || !Number.isFinite(maxX)) return null;

  try {
    const normalizedExpression = normalizeExpressionForMathJS(expression);

    if (isExpressionLikelyIncomplete(normalizedExpression)) return null;

    const pointX = Number(evaluate(normalizeExpressionForMathJS(tangentPoint)));

    if (!Number.isFinite(pointX)) return null;

    const compiledExpression = compile(normalizedExpression);
    const derivativeExpression = derivative(normalizedExpression, "x");
    const compiledDerivative = compile(derivativeExpression.toString());

    const pointY = Number(compiledExpression.evaluate({ x: pointX }));
    const slope = Number(compiledDerivative.evaluate({ x: pointX }));

    if (!Number.isFinite(pointY) || !Number.isFinite(slope)) return null;

    const x1 = minX;
    const x2 = maxX;
    const y1 = slope * (x1 - pointX) + pointY;
    const y2 = slope * (x2 - pointX) + pointY;

    return {
      pointX,
      pointY,
      slope,
      lineX: [x1, x2],
      lineY: [y1, y2],
    };
  } catch {
    return null;
  }
}

function getYRange(
  yValues: Array<number | null>,
  tangentY?: number[]
): [number, number] | undefined {
  const validY = yValues.filter(
    (value): value is number =>
      typeof value === "number" && Number.isFinite(value)
  );

  const tangentValid =
    tangentY?.filter(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value)
    ) || [];

  const all = [...validY, ...tangentValid];

  if (all.length === 0) return undefined;

  const min = Math.min(...all);
  const max = Math.max(...all);

  if (min === max) {
    return [min - 1, max + 1];
  }

  const padding = (max - min) * 0.12;
  return [min - padding, max + padding];
}

export function GraphPanel({
  expression,
  interval,
  analysis,
  selectedOperation,
  tangentPoint,
}: GraphPanelProps) {
  const source = expression.trim() || "x**3 - 3*x + 1";
  const [minX, maxX] = parseInterval(interval);

  const series = useMemo(() => {
    return buildFunctionSeries(source, minX, maxX);
  }, [source, minX, maxX]);

  const tangentData = useMemo(() => {
    if (selectedOperation !== "Derivada") return null;
    return getTangentData(source, tangentPoint, minX, maxX);
  }, [source, tangentPoint, selectedOperation, minX, maxX]);

  const plotData = useMemo<Data[]>(() => {
    if (series.parseError) return [];

    const traces: Data[] = [
      {
        x: series.x,
        y: series.y,
        type: "scatter",
        mode: "lines",
        line: { color: "#39ff14", width: 3 },
        name: source,
        hovertemplate: "x=%{x:.3f}<br>y=%{y:.3f}<extra></extra>",
      },
    ];

    const maxPoints: ParsedPoint[] =
      analysis?.local_maxima
        ?.map(parsePointString)
        .filter((p): p is ParsedPoint => p !== null) || [];

    const minPoints: ParsedPoint[] =
      analysis?.local_minima
        ?.map(parsePointString)
        .filter((p): p is ParsedPoint => p !== null) || [];

    if (maxPoints.length > 0) {
      traces.push({
        x: maxPoints.map((p) => p.x),
        y: maxPoints.map((p) => p.y),
        type: "scatter",
        mode: "markers+text",
        name: "Máximos",
        text: maxPoints.map(() => "Máx."),
        textposition: "top center",
        marker: {
          color: "#a855f7",
          size: 10,
          line: { color: "#ffffff", width: 1 },
        },
      });
    }

    if (minPoints.length > 0) {
      traces.push({
        x: minPoints.map((p) => p.x),
        y: minPoints.map((p) => p.y),
        type: "scatter",
        mode: "markers+text",
        name: "Mínimos",
        text: minPoints.map(() => "Mín."),
        textposition: "bottom center",
        marker: {
          color: "#22c55e",
          size: 10,
          line: { color: "#ffffff", width: 1 },
        },
      });
    }

    if (tangentData) {
      traces.push({
        x: tangentData.lineX,
        y: tangentData.lineY,
        type: "scatter",
        mode: "lines",
        name: "Reta tangente",
        line: {
          color: "#f59e0b",
          width: 2,
          dash: "dash",
        },
        hovertemplate: "Tangente<extra></extra>",
      });

      traces.push({
        x: [tangentData.pointX],
        y: [tangentData.pointY],
        type: "scatter",
        mode: "markers+text",
        name: "Ponto de tangência",
        text: ["T"],
        textposition: "top right",
        marker: {
          color: "#f59e0b",
          size: 10,
          line: { color: "#ffffff", width: 1 },
        },
        hovertemplate: `x=%{x:.3f}<br>y=%{y:.3f}<br>inclinação=${tangentData.slope.toFixed(
          3
        )}<extra></extra>`,
      });
    }

    return traces;
  }, [series, analysis, source, tangentData]);

  const yRange = useMemo(() => {
    return getYRange(
      series.y,
      tangentData ? tangentData.lineY.map((value) => Number(value)) : undefined
    );
  }, [series.y, tangentData]);

  const layout: Partial<Layout> = {
    autosize: true,
    datarevision: `${source}-${interval}-${tangentPoint || ""}`,
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#d4d4d8" },
    margin: { l: 40, r: 20, t: 20, b: 40 },
    xaxis: {
      range: [minX, maxX],
      gridcolor: "rgba(255,255,255,0.08)",
      zerolinecolor: "rgba(255,255,255,0.16)",
    },
    yaxis: {
      range: yRange,
      gridcolor: "rgba(255,255,255,0.08)",
      zerolinecolor: "rgba(255,255,255,0.16)",
    },
    showlegend: true,
    legend: {
      orientation: "h",
      y: 1.08,
      x: 0,
      font: { color: "#d4d4d8" },
    },
  };

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
        {series.parseError ? (
          <div className="flex h-[380px] items-center justify-center px-6 text-center">
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-yellow-400">
                Aguardando expressão válida
              </div>
              <p className="mt-3 text-sm text-zinc-300">
                O gráfico aparece automaticamente quando a expressão estiver
                completa.
              </p>
              <p className="mt-2 text-xs text-zinc-500">{series.parseError}</p>
            </div>
          </div>
        ) : (
          <Plot
            data={plotData}
            layout={layout}
            config={{
              responsive: true,
              displaylogo: false,
            }}
            style={{ width: "100%", height: "380px" }}
            useResizeHandler
          />
        )}
      </div>
    </div>
  );
}