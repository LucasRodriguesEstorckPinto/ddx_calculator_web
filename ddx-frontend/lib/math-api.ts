export type CalculatePayload = {
  mode: "alglin" | "calc1" | "calc2"; // Adicionado para o roteamento no backend
  expression: string; // Para Álgebra Linear, receberá a matriz como string JSON
  operation: string;
  variable?: string;
  point?: string;
  direction?: string;
  order?: number;
  definite_integral?: boolean;
  lower_bound?: string;
  upper_bound?: string;
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

export async function calculateMath(payload: CalculatePayload) {
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
    return JSON.parse(text);
  } catch {
    throw new Error(`INVALID_JSON: ${text.slice(0, 300)}`);
  }
}