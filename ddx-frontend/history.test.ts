import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  addHistoryEntry,
  clearHistory,
  removeHistoryEntry,
  useHistory,
  type HistoryEntry,
} from "@/lib/history";

const params = {
  expression: "x**2",
  variables: "x",
  derivativeOrder: 1,
  limitPoint: "0",
  limitDirection: "both",
  tangentPoint: "0",
  isDefiniteIntegral: false,
  lowerBound: "0",
  upperBound: "1",
};

function entry(overrides: Partial<Omit<HistoryEntry, "id" | "createdAt">> = {}) {
  return {
    mode: "calc1" as const,
    operation: "Derivada",
    params,
    result: "2*x",
    latex: "2x",
    ...overrides,
  };
}

function renderHistory() {
  return renderHook(() => useHistory());
}

describe("history store", () => {
  it("starts empty", () => {
    const { result } = renderHistory();
    expect(result.current).toEqual([]);
  });

  it("adds entries with id and timestamp, newest first", () => {
    const { result } = renderHistory();

    act(() => addHistoryEntry(entry({ operation: "Derivada" })));
    act(() => addHistoryEntry(entry({ operation: "Integral" })));

    expect(result.current.map((item) => item.operation)).toEqual([
      "Integral",
      "Derivada",
    ]);
    expect(result.current[0].id).toEqual(expect.any(String));
    expect(result.current[0].createdAt).toEqual(expect.any(Number));
  });

  it("moves a repeated calculation to the top instead of duplicating it", () => {
    const { result } = renderHistory();

    act(() => addHistoryEntry(entry({ operation: "Derivada" })));
    act(() => addHistoryEntry(entry({ operation: "Integral" })));
    act(() => addHistoryEntry(entry({ operation: "Derivada" })));

    expect(result.current.map((item) => item.operation)).toEqual([
      "Derivada",
      "Integral",
    ]);
  });

  it("treats different parameters as different calculations", () => {
    const { result } = renderHistory();

    act(() => addHistoryEntry(entry()));
    act(() => addHistoryEntry(entry({ params: { ...params, derivativeOrder: 2 } })));

    expect(result.current).toHaveLength(2);
  });

  it("keeps at most 30 entries, dropping the oldest", () => {
    const { result } = renderHistory();

    act(() => {
      for (let i = 0; i < 35; i += 1) {
        addHistoryEntry(entry({ params: { ...params, expression: `x**${i}` } }));
      }
    });

    expect(result.current).toHaveLength(30);
    expect(result.current[0].params.expression).toBe("x**34");
    expect(result.current[29].params.expression).toBe("x**5");
  });

  it("removes a single entry", () => {
    const { result } = renderHistory();
    act(() => addHistoryEntry(entry({ operation: "Derivada" })));
    act(() => addHistoryEntry(entry({ operation: "Integral" })));

    act(() => removeHistoryEntry(result.current[0].id));

    expect(result.current.map((item) => item.operation)).toEqual(["Derivada"]);
  });

  it("clears everything", () => {
    const { result } = renderHistory();
    act(() => addHistoryEntry(entry()));

    act(() => clearHistory());

    expect(result.current).toEqual([]);
  });

  it("persists to localStorage", () => {
    renderHistory();
    act(() => addHistoryEntry(entry()));

    const stored = JSON.parse(window.localStorage.getItem("ddx:history:v1") ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].operation).toBe("Derivada");
  });

  it("loads previously stored entries", () => {
    act(() => addHistoryEntry(entry({ operation: "Limite" })));

    const { result } = renderHistory();

    expect(result.current[0].operation).toBe("Limite");
  });

  it.each([
    ["corrupt json", "{bad"],
    ["a non-array value", '{"a":1}'],
  ])("ignores %s in storage", (_label, raw) => {
    window.localStorage.setItem("ddx:history:v1", raw);

    const { result } = renderHistory();

    expect(result.current).toEqual([]);
  });
});