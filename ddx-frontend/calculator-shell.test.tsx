import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CalculatorShell } from "@/components/calculator/calculator-shell";
import { calculateMath, type CalculateResponse } from "@/lib/math-api";

vi.mock("@/lib/math-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/math-api")>()),
  calculateMath: vi.fn(),
}));

vi.mock("@/components/calculator/graph-panel", () => ({
  GraphPanel: () => <div data-testid="graph-panel" />,
}));

vi.mock("@/components/calculator/ai-panel", () => ({
  AiPanel: () => null,
}));

const mockedCalculate = vi.mocked(calculateMath);

function response(overrides: Partial<CalculateResponse> = {}): CalculateResponse {
  return {
    success: true,
    result: "2*x",
    latex: "2x",
    steps: [],
    error: "",
    analysis: null,
    ...overrides,
  };
}

function setup() {
  const user = userEvent.setup();
  render(<CalculatorShell />);
  return user;
}

async function switchToCalculus(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Cálculo 1" }));
}

async function calculate(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Calcular" }));
}

async function replaceText(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  value: string
) {
  const field = screen.getByLabelText(label);
  await user.clear(field);
  await user.type(field, value);
}

describe("CalculatorShell initial state", () => {
  it("starts in linear algebra mode without a graph", () => {
    setup();

    expect(screen.getByText("Análise Matricial e Vetorial")).toBeInTheDocument();
    expect(screen.getByLabelText("Operação")).toHaveValue("Escalonamento");
    expect(screen.getByText("Ainda não calculado")).toBeInTheDocument();
    expect(screen.queryByTestId("graph-panel")).not.toBeInTheDocument();
  });

  it("shows the empty history message", () => {
    setup();

    expect(screen.getByText(/aparecem aqui/i)).toBeInTheDocument();
  });
});

describe("CalculatorShell linear algebra flow", () => {
  it("sends the grid and shows the processed result", async () => {
    mockedCalculate.mockResolvedValue(response({ result: "Matrix", latex: "I" }));
    const user = setup();

    await calculate(user);

    expect(await screen.findByText("Processado")).toBeInTheDocument();
    expect(mockedCalculate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "alglin",
        operation: "Escalonamento",
        expression: JSON.stringify([
          ["", "", ""],
          ["", "", ""],
          ["", "", ""],
        ]),
      })
    );
  });

  it("includes the typed cell values in the request", async () => {
    mockedCalculate.mockResolvedValue(response());
    const user = setup();

    await user.type(screen.getByLabelText("Linha 1, coluna 1"), "5");
    await calculate(user);

    const sent = mockedCalculate.mock.calls[0][0];
    expect(JSON.parse(sent.expression)[0][0]).toBe("5");
  });
});

describe("CalculatorShell calculus flow", () => {
  it("switches mode, resets inputs and reveals the graph", async () => {
    const user = setup();

    await switchToCalculus(user);

    expect(screen.getByText("Análise da Função")).toBeInTheDocument();
    expect(screen.getByLabelText("Operação")).toHaveValue("Derivada");
    expect(screen.getByLabelText("Expressão")).toHaveValue("x**3 - 3*x + 1");
    expect(screen.getByTestId("graph-panel")).toBeInTheDocument();
  });

  it("sends default derivative parameters", async () => {
    mockedCalculate.mockResolvedValue(response());
    const user = setup();
    await switchToCalculus(user);

    await calculate(user);

    expect(mockedCalculate).toHaveBeenCalledWith({
      mode: "calc1",
      expression: "x**3 - 3*x + 1",
      operation: "Derivada",
      variable: "x",
      point: "0",
      direction: "both",
      order: 1,
      definite_integral: false,
      lower_bound: "0",
      upper_bound: "1",
    });
  });

  it("sends limit point and direction", async () => {
    mockedCalculate.mockResolvedValue(response());
    const user = setup();
    await switchToCalculus(user);
    await user.selectOptions(screen.getByLabelText("Operação"), "Limite");

    await replaceText(user, "x tende a", "oo");
    await user.selectOptions(screen.getByLabelText("Direção"), "+");
    await calculate(user);

    expect(mockedCalculate).toHaveBeenCalledWith(
      expect.objectContaining({ operation: "Limite", point: "oo", direction: "+" })
    );
  });

  it("uses the tangent point as the point for the tangent line", async () => {
    mockedCalculate.mockResolvedValue(response());
    const user = setup();
    await switchToCalculus(user);
    await user.selectOptions(screen.getByLabelText("Operação"), "Reta Tangente");

    await replaceText(user, "Ponto de tangência (x = a)", "2");
    await calculate(user);

    expect(mockedCalculate).toHaveBeenCalledWith(
      expect.objectContaining({ operation: "Reta Tangente", point: "2" })
    );
  });

  it("sends definite integral bounds", async () => {
    mockedCalculate.mockResolvedValue(response());
    const user = setup();
    await switchToCalculus(user);
    await user.selectOptions(screen.getByLabelText("Operação"), "Integral");

    await user.click(screen.getByRole("checkbox", { name: "Integral definida" }));
    await replaceText(user, "Limite inferior", "-1");
    await replaceText(user, "Limite superior", "oo");
    await calculate(user);

    expect(mockedCalculate).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: "Integral",
        definite_integral: true,
        lower_bound: "-1",
        upper_bound: "oo",
      })
    );
  });

  it("sends the derivative order", async () => {
    mockedCalculate.mockResolvedValue(response());
    const user = setup();
    await switchToCalculus(user);

    await user.selectOptions(screen.getByLabelText("Ordem da derivada"), "3");
    await calculate(user);

    expect(mockedCalculate).toHaveBeenCalledWith(expect.objectContaining({ order: 3 }));
  });

  it("uses only the first variable", async () => {
    mockedCalculate.mockResolvedValue(response());
    const user = setup();
    await switchToCalculus(user);

    await replaceText(user, "Variável", "t, s");
    await calculate(user);

    expect(mockedCalculate).toHaveBeenCalledWith(expect.objectContaining({ variable: "t" }));
  });

  it("falls back to x when the variable is blank", async () => {
    mockedCalculate.mockResolvedValue(response());
    const user = setup();
    await switchToCalculus(user);

    await user.clear(screen.getByLabelText("Variável"));
    await calculate(user);

    expect(mockedCalculate).toHaveBeenCalledWith(expect.objectContaining({ variable: "x" }));
  });
});

describe("CalculatorShell outcomes", () => {
  it("shows the backend error and keeps it out of the history", async () => {
    mockedCalculate.mockResolvedValue(
      response({ success: false, error: "A matriz não é invertível", result: "", latex: "" })
    );
    const user = setup();

    await calculate(user);

    expect(await screen.findByText("A matriz não é invertível")).toBeInTheDocument();
    expect(screen.getByText("Erro")).toBeInTheDocument();
    expect(screen.getByText(/aparecem aqui/i)).toBeInTheDocument();
  });

  it.each([
    ["TIMEOUT", "O backend demorou demais para responder."],
    ["HTTP_500: boom", "Erro do servidor: 500: boom"],
    ["INVALID_JSON: <html>", "O backend respondeu, mas o JSON veio inválido."],
    ["Failed to fetch", "Não foi possível conectar ao backend matemático."],
  ])("translates the failure %s into a friendly message", async (raw, friendly) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockedCalculate.mockRejectedValue(new Error(raw));
    const user = setup();

    await calculate(user);

    expect(await screen.findByText(friendly)).toBeInTheDocument();
  });

  it("handles non-Error rejections", async () => {
    mockedCalculate.mockRejectedValue("boom");
    const user = setup();

    await calculate(user);

    expect(
      await screen.findByText("Não foi possível conectar ao backend matemático.")
    ).toBeInTheDocument();
  });

  it("disables the button while the request is pending", async () => {
    let finish: (value: CalculateResponse) => void = () => {};
    mockedCalculate.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const user = setup();

    await calculate(user);
    expect(screen.getByRole("button", { name: "Processando..." })).toBeDisabled();

    finish(response());
    expect(await screen.findByRole("button", { name: "Calcular" })).toBeEnabled();
  });

  it("clears the previous result when the operation changes", async () => {
    mockedCalculate.mockResolvedValue(response());
    const user = setup();
    await switchToCalculus(user);
    await calculate(user);
    expect(await screen.findByText("Processado")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Operação"), "Integral");

    expect(screen.getByText("Aguardando")).toBeInTheDocument();
  });

  it("clears the previous result when the mode changes", async () => {
    mockedCalculate.mockResolvedValue(response());
    const user = setup();
    await calculate(user);
    expect(await screen.findByText("Processado")).toBeInTheDocument();

    await switchToCalculus(user);

    expect(screen.getByText("Aguardando")).toBeInTheDocument();
  });
});

describe("CalculatorShell history", () => {
  it("records successful calculations", async () => {
    mockedCalculate.mockResolvedValue(response());
    const user = setup();
    await switchToCalculus(user);

    await calculate(user);

    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(1));
    expect(screen.getByText("= 2*x")).toBeInTheDocument();
  });

  it("restores inputs and recalculates when an entry is reopened", async () => {
    mockedCalculate.mockResolvedValue(response());
    const user = setup();
    await switchToCalculus(user);
    await user.selectOptions(screen.getByLabelText("Operação"), "Limite");
    await replaceText(user, "x tende a", "oo");
    await calculate(user);
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(1));
    const firstRequest = mockedCalculate.mock.calls[0][0];

    await user.click(screen.getByRole("button", { name: "Álgebra Linear" }));
    expect(screen.getByLabelText("Operação")).toHaveValue("Escalonamento");

    await user.click(screen.getByRole("button", { name: /reabrir/i }));

    await waitFor(() => expect(mockedCalculate).toHaveBeenCalledTimes(2));
    expect(mockedCalculate.mock.calls[1][0]).toEqual(firstRequest);
    expect(screen.getByLabelText("Operação")).toHaveValue("Limite");
    expect(screen.getByLabelText("x tende a")).toHaveValue("oo");
  });
});