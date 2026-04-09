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

export async function calculateMath(payload: CalculatePayload) {
  const response = await fetch("http://localhost:8000/calculate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return response.json();
}