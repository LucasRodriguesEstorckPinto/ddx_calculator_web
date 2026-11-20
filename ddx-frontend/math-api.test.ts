import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { calculateMath, type CalculatePayload } from "@/lib/math-api";

const payload: CalculatePayload = {
  mode: "calc1",
  expression: "x**2",
  operation: "Derivada",
  variable: "x",
};

function respondWith(body: string, init: ResponseInit = { status: 200 }) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(body, init));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("calculateMath", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("posts the payload as JSON to /calculate", async () => {
    const fetchMock = respondWith(JSON.stringify({ success: true }));

    await calculateMath(payload);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("http://127.0.0.1:8000/calculate");
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(options.body)).toEqual(payload);
  });

  it("returns the backend response unchanged when complete", async () => {
    const body = {
      success: true,
      result: "2*x",
      latex: "2x",
      steps: [{ title: "t", latex: "l", note: "" }],
      error: "",
      analysis: null,
    };
    respondWith(JSON.stringify(body));

    await expect(calculateMath(payload)).resolves.toEqual(body);
  });

  it("fills missing fields with safe defaults", async () => {
    respondWith(JSON.stringify({ success: true }));

    await expect(calculateMath(payload)).resolves.toEqual({
      success: true,
      result: "",
      latex: "",
      steps: [],
      error: "",
      analysis: null,
    });
  });

  it("throws HTTP_<status> with a truncated body for error responses", async () => {
    respondWith("x".repeat(500), { status: 500 });

    const error = await calculateMath(payload).catch((e: Error) => e);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message.startsWith("HTTP_500: ")).toBe(true);
    expect((error as Error).message.length).toBeLessThan(320);
  });

  it("throws INVALID_JSON when the body is not JSON", async () => {
    respondWith("<html>oops</html>");

    await expect(calculateMath(payload)).rejects.toThrow(/^INVALID_JSON:/);
  });

  it("throws TIMEOUT when the backend never answers", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));

    const assertion = expect(calculateMath(payload)).rejects.toThrow("TIMEOUT");
    await vi.advanceTimersByTimeAsync(10_000);

    await assertion;
  });

  it("propagates network failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(calculateMath(payload)).rejects.toThrow("Failed to fetch");
  });
});