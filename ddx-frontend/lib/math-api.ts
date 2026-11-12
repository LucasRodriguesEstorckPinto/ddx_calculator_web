export type CalcMode = "alglin" | "calc1";

export type CalculatePayload = {
  mode: CalcMode;
  expression: string;
  operation: string;
  variable?: string;
  point?: string;
  direction?: string; // "+", "-" ou "both"
  order?: number;
  definite_integral?: boolean;
  lower_bound?: string;
  upper_bound?: string;
};

export type CalcStep = {
  title: string;
  latex: string;
  note: string;
};

export type AnalysisResult = {
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

export type CalculateResponse = {
  success: boolean;
  result: string;
  latex: string;
  steps: CalcStep[];
  error: string;
  analysis: AnalysisResult;
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("TIMEOUT")), ms);

    promise
      .then((value) => {
        clearTimeout(id);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(id);
        reject(error);
      });
  });
}

const API_BASE =
  process.env.NEXT_PUBLIC_MATH_API_URL?.trim() || "http://127.0.0.1:8000";

export async function calculateMath(
  payload: CalculatePayload
): Promise<CalculateResponse> {
  const response = await withTimeout(
    fetch(`${API_BASE}/calculate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }),
    10000 // 10 segundos de timeout
  );

  const text = await withTimeout(response.text(), 10000);

  if (!response.ok) {
    throw new Error(`HTTP_${response.status}: ${text.slice(0, 300)}`);
  }

  try {
    const data = JSON.parse(text) as Partial<CalculateResponse>;
    return {
      success: Boolean(data.success),
      result: data.result ?? "",
      latex: data.latex ?? "",
      steps: data.steps ?? [],
      error: data.error ?? "",
      analysis: data.analysis ?? null,
    };
  } catch {
    throw new Error(`INVALID_JSON: ${text.slice(0, 300)}`);
  }
}