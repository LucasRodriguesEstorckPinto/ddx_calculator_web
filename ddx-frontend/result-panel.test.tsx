import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";

import { ResultPanel } from "@/components/calculator/result-panel";

type Props = ComponentProps<typeof ResultPanel>;

function buildProps(overrides: Partial<Props> = {}): Props {
  return {
    mode: "calc1",
    expression: "x**2",
    selectedOperation: "Derivada",
    status: "success",
    computedResult: "2*x",
    latex: "f'(x) = 2x",
    steps: [],
    error: "",
    analysis: null,
    ...overrides,
  };
}

function renderPanel(overrides: Partial<Props> = {}) {
  return render(<ResultPanel {...buildProps(overrides)} />);
}

describe("ResultPanel states", () => {
  it("shows the idle message without actions", () => {
    renderPanel({ status: "idle", computedResult: "Ainda não calculado", latex: "" });

    expect(screen.getByText("Ainda não calculado")).toBeInTheDocument();
    expect(screen.getByText("Aguardando")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /copiar/i })).not.toBeInTheDocument();
  });

  it("shows the error message", () => {
    renderPanel({ status: "error", error: "A matriz não é invertível", latex: "" });

    expect(screen.getByText("A matriz não é invertível")).toBeInTheDocument();
    expect(screen.getByText("Erro")).toBeInTheDocument();
  });

  it("renders the result as LaTeX when available", () => {
    const { container } = renderPanel();

    expect(container.querySelector(".katex")).toBeInTheDocument();
    expect(screen.getByText("Processado")).toBeInTheDocument();
  });

  it("falls back to plain text when there is no LaTeX", () => {
    renderPanel({ latex: "", computedResult: "Estudo de função concluído." });

    expect(screen.getByText("Estudo de função concluído.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copiar LaTeX" })).not.toBeInTheDocument();
  });

  it("shows the operation and the current expression for calculus", () => {
    renderPanel({ selectedOperation: "Integral", expression: "sin(x)" });

    expect(screen.getByText("Integral")).toBeInTheDocument();
    expect(screen.getByText("sin(x)")).toBeInTheDocument();
    expect(screen.getByText("Análise da Função")).toBeInTheDocument();
  });

  it("renders the input grid as a matrix in linear algebra mode", () => {
    const { container } = renderPanel({
      mode: "alglin",
      selectedOperation: "Determinante",
      expression: JSON.stringify([
        ["1", "2"],
        ["3", "4"],
      ]),
    });

    expect(screen.getByText("Dados de Entrada")).toBeInTheDocument();
    expect(screen.getByText("Análise Matricial e Vetorial")).toBeInTheDocument();
    expect(container.querySelectorAll(".katex").length).toBeGreaterThanOrEqual(2);
  });
});

describe("ResultPanel clipboard actions", () => {
  it("copies the plain-text result", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: "Copiar texto" }));

    expect(await navigator.clipboard.readText()).toBe("2*x");
  });

  it("copies the LaTeX source", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: "Copiar LaTeX" }));

    expect(await navigator.clipboard.readText()).toBe("f'(x) = 2x");
  });
});

describe("ResultPanel step list", () => {
  const steps = [
    { title: "Função", latex: "f(x) = x^2", note: "" },
    { title: "Regra da potência", latex: "2x", note: "Derivada de x elevado a n" },
  ];

  it("lists every step with its count", () => {
    renderPanel({ steps });

    expect(screen.getByText("Passo a passo (2)")).toBeInTheDocument();
    expect(screen.getByText("Função")).toBeInTheDocument();
    expect(screen.getByText("Regra da potência")).toBeInTheDocument();
    expect(screen.getByText("Derivada de x elevado a n")).toBeInTheDocument();
  });

  it("collapses and expands", async () => {
    renderPanel({ steps });
    const toggle = screen.getByRole("button", { name: /passo a passo/i });

    await userEvent.click(toggle);
    expect(screen.queryByText("Regra da potência")).not.toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(toggle);
    expect(screen.getByText("Regra da potência")).toBeInTheDocument();
  });

  it("is hidden without steps", () => {
    renderPanel({ steps: [] });

    expect(screen.queryByText(/passo a passo/i)).not.toBeInTheDocument();
  });

  it("is hidden when the calculation failed", () => {
    renderPanel({ status: "error", error: "falhou", steps });

    expect(screen.queryByText(/passo a passo/i)).not.toBeInTheDocument();
  });
});

describe("ResultPanel function analysis", () => {
  const analysis = {
    mode_message: "Estudo de função calculado no domínio real.",
    first_derivative: "3*x**2 - 3",
    second_derivative: "6*x",
    critical_points: ["-1", "1"],
    local_maxima: ["(-1, 3)"],
    local_minima: ["(1, -1)"],
    vertical_asymptotes: [],
  };

  it("renders the analysis cards", () => {
    renderPanel({
      selectedOperation: "Estudo de Função",
      computedResult: "Estudo de função concluído.",
      latex: "",
      analysis,
    });

    expect(screen.getByText("Estudo de função calculado no domínio real.")).toBeInTheDocument();
    expect(screen.getByText("3*x**2 - 3")).toBeInTheDocument();
    expect(screen.getByText("(-1, 3)")).toBeInTheDocument();
    expect(screen.getByText("(1, -1)")).toBeInTheDocument();
    expect(screen.getAllByText("Nenhum").length).toBeGreaterThan(0);
  });

  it("does not render for other operations", () => {
    renderPanel({ selectedOperation: "Derivada", analysis });

    expect(screen.queryByText("Pontos críticos (x)")).not.toBeInTheDocument();
  });

  it("does not render when there is no analysis", () => {
    renderPanel({ selectedOperation: "Estudo de Função", analysis: null });

    expect(screen.queryByText("Pontos críticos (x)")).not.toBeInTheDocument();
  });
});
