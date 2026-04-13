export type CalculatePayload = {
  expression: string;
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

export async function calculateMath(payload: CalculatePayload) {
  const response = await withTimeout(
    fetch("http://127.0.0.1:8000/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }),
    10000
  );

  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }

  const text = await withTimeout(response.text(), 10000);

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`INVALID_JSON: ${text.slice(0, 300)}`);
  }
}