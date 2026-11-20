import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import { InputPanel } from "@/components/calculator/input-panel";

type Props = ComponentProps<typeof InputPanel>;

const grid = (rows: string[][]) => JSON.stringify(rows);

function buildProps(overrides: Partial<Props> = {}): Props {
  return {
    mode: "alglin",
    expression: grid([
      ["1", "2", ""],
      ["", "", ""],
      ["", "", "9"],
    ]),
    setExpression: vi.fn(),
    selectedOperation: "Escalonamento",
    setSelectedOperation: vi.fn(),
    variables: "x",
    setVariables: vi.fn(),
    interval: "[-10, 10]",
    setIntervalValue: vi.fn(),
    onCalculate: vi.fn(),
    loading: false,
    derivativeOrder: 1,
    setDerivativeOrder: vi.fn(),
    limitPoint: "0",
    setLimitPoint: vi.fn(),
    limitDirection: "both",
    setLimitDirection: vi.fn(),
    tangentPoint: "0",
    setTangentPoint: vi.fn(),
    isDefiniteIntegral: false,
    setIsDefiniteIntegral: vi.fn(),
    lowerBound: "0",
    setLowerBound: vi.fn(),
    upperBound: "1",
    setUpperBound: vi.fn(),
    ...overrides,
  };
}

function renderCalculus(overrides: Partial<Props> = {}) {
  const props = buildProps({
    mode: "calc1",
    expression: "x**2",
    selectedOperation: "Derivada",
    ...overrides,
  });
  render(<InputPanel {...props} />);
  return props;
}

function operationSelect() {
  return screen.getByLabelText("Operação");
}

function optionLabels() {
  return within(operationSelect())
    .getAllByRole("option")
    .map((option) => option.textContent);
}

describe("InputPanel in linear algebra mode", () => {
  it("offers only matrix operations", () => {
    render(<InputPanel {...buildProps()} />);

    const labels = optionLabels();
    expect(labels).toContain("Determinante");
    expect(labels).toContain("Decomposição LU");
    expect(labels).not.toContain("Derivada");
  });

  it("renders the grid described by the expression", () => {
    render(<InputPanel {...buildProps()} />);

    expect(screen.getByLabelText("Linha 1, coluna 1")).toHaveValue("1");
    expect(screen.getByLabelText("Linha 3, coluna 3")).toHaveValue("9");
    expect(screen.getAllByPlaceholderText("0")).toHaveLength(9);
  });

  it("falls back to an empty 3x3 grid when the expression is not a grid", () => {
    render(<InputPanel {...buildProps({ expression: "garbage" })} />);

    expect(screen.getAllByPlaceholderText("0")).toHaveLength(9);
    expect(screen.getByLabelText("Linha 1, coluna 1")).toHaveValue("");
  });

  it("emits the updated grid when a cell changes", async () => {
    const props = buildProps();
    render(<InputPanel {...props} />);

    await userEvent.type(screen.getByLabelText("Linha 2, coluna 2"), "7");

    expect(props.setExpression).toHaveBeenCalledWith(
      grid([
        ["1", "2", ""],
        ["", "7", ""],
        ["", "", "9"],
      ])
    );
  });

  it("keeps existing values when the grid is resized", () => {
    const props = buildProps();
    render(<InputPanel {...props} />);

    fireEvent.change(screen.getByLabelText("Número de linhas"), {
      target: { value: "2" },
    });

    expect(props.setExpression).toHaveBeenCalledWith(
      grid([
        ["1", "2", ""],
        ["", "", ""],
      ])
    );
  });

  it("pads new cells with empty strings when the grid grows", () => {
    const props = buildProps({ expression: grid([["1"]]) });
    render(<InputPanel {...props} />);

    fireEvent.change(screen.getByLabelText("Número de colunas"), {
      target: { value: "2" },
    });

    expect(props.setExpression).toHaveBeenCalledWith(grid([["1", ""]]));
  });

  it.each([
    ["9", 6],
    ["0", 1],
    ["-3", 1],
  ])("clamps dimension %s to %i", (typed, expected) => {
    const props = buildProps();
    render(<InputPanel {...props} />);

    fireEvent.change(screen.getByLabelText("Número de linhas"), {
      target: { value: typed },
    });

    const emitted = JSON.parse(vi.mocked(props.setExpression).mock.calls[0][0]);
    expect(emitted).toHaveLength(expected);
  });

  it("fills the identity matrix", async () => {
    const props = buildProps();
    render(<InputPanel {...props} />);

    await userEvent.click(screen.getByRole("button", { name: "Identidade" }));

    expect(props.setExpression).toHaveBeenCalledWith(
      grid([
        ["1", "0", "0"],
        ["0", "1", "0"],
        ["0", "0", "1"],
      ])
    );
  });

  it("clears the grid", async () => {
    const props = buildProps();
    render(<InputPanel {...props} />);

    await userEvent.click(screen.getByRole("button", { name: "Limpar" }));

    expect(props.setExpression).toHaveBeenCalledWith(
      grid([
        ["", "", ""],
        ["", "", ""],
        ["", "", ""],
      ])
    );
  });

  it("calculates when Enter is pressed inside a cell", async () => {
    const props = buildProps();
    render(<InputPanel {...props} />);

    await userEvent.type(screen.getByLabelText("Linha 1, coluna 1"), "{Enter}");

    expect(props.onCalculate).toHaveBeenCalledTimes(1);
  });

  it("explains how to enter a linear system", () => {
    render(<InputPanel {...buildProps({ selectedOperation: "Sistema Linear" })} />);

    expect(screen.getByText(/matriz ampliada/i)).toBeInTheDocument();
  });

  it("hides calculus-only fields", () => {
    render(<InputPanel {...buildProps()} />);

    expect(screen.queryByLabelText("Variável")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Intervalo do gráfico")).not.toBeInTheDocument();
  });
});

describe("InputPanel in calculus mode", () => {
  it("offers only calculus operations", () => {
    renderCalculus();

    const labels = optionLabels();
    expect(labels).toEqual([
      "Derivada",
      "Integral",
      "Limite",
      "Estudo de Função",
      "Raízes",
      "Reta Tangente",
    ]);
  });

  it("notifies the selected operation", async () => {
    const props = renderCalculus();

    await userEvent.selectOptions(operationSelect(), "Raízes");

    expect(props.setSelectedOperation).toHaveBeenCalledWith("Raízes");
  });

  it("edits the expression", () => {
    const props = renderCalculus();

    fireEvent.change(screen.getByLabelText("Expressão"), {
      target: { value: "sin(x)" },
    });

    expect(props.setExpression).toHaveBeenCalledWith("sin(x)");
  });

  it("calculates with Ctrl+Enter but not with plain Enter", async () => {
    const props = renderCalculus();
    const textarea = screen.getByLabelText("Expressão");

    await userEvent.type(textarea, "{Enter}");
    expect(props.onCalculate).not.toHaveBeenCalled();

    await userEvent.type(textarea, "{Control>}{Enter}{/Control}");
    expect(props.onCalculate).toHaveBeenCalledTimes(1);
  });

  it("applies an example expression", async () => {
    const props = renderCalculus();

    await userEvent.click(screen.getByRole("button", { name: "x**2*sin(x)" }));

    expect(props.setExpression).toHaveBeenCalledWith("x**2*sin(x)");
  });

  it("shows the variable and interval fields", () => {
    renderCalculus();

    expect(screen.getByLabelText("Variável")).toBeInTheDocument();
    expect(screen.getByLabelText("Intervalo do gráfico")).toHaveValue("[-10, 10]");
  });

  it("shows derivative order and tangent point for derivatives", async () => {
    const props = renderCalculus();

    expect(screen.getByLabelText("Ordem da derivada")).toBeInTheDocument();
    expect(screen.getByLabelText("Ponto da reta tangente no gráfico")).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("Ordem da derivada"), "3");
    expect(props.setDerivativeOrder).toHaveBeenCalledWith(3);
  });

  it("shows only the tangent point for the tangent line operation", () => {
    renderCalculus({ selectedOperation: "Reta Tangente" });

    expect(screen.getByLabelText("Ponto de tangência (x = a)")).toBeInTheDocument();
    expect(screen.queryByLabelText("Ordem da derivada")).not.toBeInTheDocument();
  });

  it("shows the limit controls and reports changes", async () => {
    const props = renderCalculus({ selectedOperation: "Limite" });

    expect(screen.getByLabelText("x tende a")).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("Direção"), "+");
    expect(props.setLimitDirection).toHaveBeenCalledWith("+");

    fireEvent.change(screen.getByLabelText("x tende a"), {
      target: { value: "oo" },
    });
    expect(props.setLimitPoint).toHaveBeenCalledWith("oo");
  });

  it("reveals integral bounds only for definite integrals", () => {
    const { rerender } = render(
      <InputPanel
        {...buildProps({
          mode: "calc1",
          expression: "x",
          selectedOperation: "Integral",
          isDefiniteIntegral: false,
        })}
      />
    );
    expect(screen.queryByLabelText("Limite inferior")).not.toBeInTheDocument();

    rerender(
      <InputPanel
        {...buildProps({
          mode: "calc1",
          expression: "x",
          selectedOperation: "Integral",
          isDefiniteIntegral: true,
        })}
      />
    );
    expect(screen.getByLabelText("Limite inferior")).toBeInTheDocument();
    expect(screen.getByLabelText("Limite superior")).toBeInTheDocument();
  });

  it("toggles the definite integral option", async () => {
    const props = renderCalculus({ selectedOperation: "Integral" });

    await userEvent.click(screen.getByRole("checkbox", { name: "Integral definida" }));

    expect(props.setIsDefiniteIntegral).toHaveBeenCalledWith(true);
  });

  it("shows no operation-specific box for the function study", () => {
    renderCalculus({ selectedOperation: "Estudo de Função" });

    expect(screen.queryByLabelText("Ordem da derivada")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("x tende a")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});

describe("InputPanel calculate button", () => {
  it("triggers the calculation", async () => {
    const props = renderCalculus();

    await userEvent.click(screen.getByRole("button", { name: "Calcular" }));

    expect(props.onCalculate).toHaveBeenCalledTimes(1);
  });

  it("is disabled while loading", () => {
    renderCalculus({ loading: true });

    expect(screen.getByRole("button", { name: "Processando..." })).toBeDisabled();
  });
});
