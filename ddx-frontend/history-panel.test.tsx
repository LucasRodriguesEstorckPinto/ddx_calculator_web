import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { HistoryPanel } from "@/components/calculator/history-panel";
import {
  addHistoryEntry,
  type HistoryEntry,
  type HistoryParams,
} from "@/lib/history";

const baseParams: HistoryParams = {
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

function seedCalculus(operation: string, result: string, expression = "x**2") {
  act(() =>
    addHistoryEntry({
      mode: "calc1",
      operation,
      params: { ...baseParams, expression },
      result,
      latex: "",
    })
  );
}

function seedMatrix() {
  act(() =>
    addHistoryEntry({
      mode: "alglin",
      operation: "Determinante",
      params: { ...baseParams, expression: JSON.stringify([["1", "2"], ["3", "4"]]) },
      result: "-2",
      latex: "",
    })
  );
}

describe("HistoryPanel", () => {
  it("explains that the history is empty", () => {
    render(<HistoryPanel onRestore={vi.fn()} />);

    expect(screen.getByText(/aparecem aqui/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /limpar/i })).not.toBeInTheDocument();
  });

  it("lists entries with operation, expression and first result line", () => {
    seedCalculus("Derivada", "2*x");
    render(<HistoryPanel onRestore={vi.fn()} />);

    expect(screen.getByText("Derivada")).toBeInTheDocument();
    expect(screen.getByText("x**2")).toBeInTheDocument();
    expect(screen.getByText("= 2*x")).toBeInTheDocument();
  });

  it("summarizes matrices by their size", () => {
    seedMatrix();
    render(<HistoryPanel onRestore={vi.fn()} />);

    expect(screen.getByText("Matriz 2×2")).toBeInTheDocument();
  });

  it("shows only the first line of multi-line results", () => {
    seedCalculus("Raízes", "x = 2\nx = 3");
    render(<HistoryPanel onRestore={vi.fn()} />);

    expect(screen.getByText("= x = 2")).toBeInTheDocument();
    expect(screen.queryByText(/x = 3/)).not.toBeInTheDocument();
  });

  it("orders entries from newest to oldest", () => {
    seedCalculus("Derivada", "a");
    seedCalculus("Integral", "b", "x");
    render(<HistoryPanel onRestore={vi.fn()} />);

    const items = screen.getAllByRole("listitem");
    expect(within(items[0]).getByText("Integral")).toBeInTheDocument();
    expect(within(items[1]).getByText("Derivada")).toBeInTheDocument();
  });

  it("restores the chosen entry", async () => {
    seedCalculus("Derivada", "2*x");
    const onRestore = vi.fn();
    render(<HistoryPanel onRestore={onRestore} />);

    await userEvent.click(screen.getByRole("button", { name: /reabrir/i }));

    const restored = onRestore.mock.calls[0][0] as HistoryEntry;
    expect(restored.operation).toBe("Derivada");
    expect(restored.params.expression).toBe("x**2");
  });

  it("removes a single entry", async () => {
    seedCalculus("Derivada", "a");
    seedCalculus("Integral", "b", "x");
    render(<HistoryPanel onRestore={vi.fn()} />);

    await userEvent.click(screen.getAllByRole("button", { name: "Remover do histórico" })[0]);

    expect(screen.queryByText("Integral")).not.toBeInTheDocument();
    expect(screen.getByText("Derivada")).toBeInTheDocument();
  });

  it("clears the whole history", async () => {
    seedCalculus("Derivada", "a");
    seedCalculus("Integral", "b", "x");
    render(<HistoryPanel onRestore={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /limpar/i }));

    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    expect(screen.getByText(/aparecem aqui/i)).toBeInTheDocument();
  });
});
