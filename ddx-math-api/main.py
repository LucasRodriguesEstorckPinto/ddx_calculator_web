import json
import math
import re
from typing import Any, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sympy import (
    Add,
    Eq,
    Integral,
    Matrix,
    Rational,
    S,
    Symbol,
    diff,
    eye,
    factor,
    integrate,
    latex,
    limit,
    linsolve,
    oo,
    simplify,
    solveset,
    symbols,
    zoo,
)
from sympy.calculus.singularities import singularities
from sympy.parsing.sympy_parser import (
    convert_xor,
    implicit_multiplication,
    parse_expr,
    standard_transformations,
)
from sympy.printing.str import sstr

app = FastAPI(title="DDX Math API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CalculateRequest(BaseModel):
    mode: Optional[str] = "calc1"
    expression: str
    operation: str
    variable: Optional[str] = "x"
    point: Optional[str] = None
    direction: Optional[str] = "+"  # "+", "-" ou "both"
    order: Optional[int] = 1
    definite_integral: Optional[bool] = False
    lower_bound: Optional[str] = None
    upper_bound: Optional[str] = None



def step(title: str, tex: Optional[str] = None, note: Optional[str] = None) -> dict:
    return {"title": title, "latex": tex or "", "note": note or ""}


def ok(result: str, tex: Optional[str] = None, steps: Optional[list] = None, analysis: Any = None) -> dict:
    return {
        "success": True,
        "result": result,
        "latex": tex or "",
        "steps": steps or [],
        "error": "",
        "analysis": analysis,
    }


def fail(message: str) -> dict:
    return {"success": False, "result": "", "latex": "", "steps": [], "error": message, "analysis": None}


class InvalidInput(Exception):
    """Entrada do usuário inválida (mensagem já pronta para exibição)."""



_ALLOWED_CHARS = re.compile(r"^[0-9A-Za-z_+\-*/^().,\s]*$")
_TRANSFORMS = standard_transformations + (convert_xor, implicit_multiplication)


def parse_math(text: Any):
    raw = str(text if text is not None else "").strip().replace("∞", "oo")
    if not raw:
        raise InvalidInput("Há um campo vazio. Preencha a expressão antes de calcular.")
    if len(raw) > 300 or "__" in raw or not _ALLOWED_CHARS.match(raw):
        raise InvalidInput("A expressão contém caracteres não permitidos.")
    try:
        return parse_expr(raw, transformations=_TRANSFORMS)
    except Exception as exc:
        raise InvalidInput("Não foi possível interpretar a expressão matemática.") from exc


def parse_point(text: Optional[str]):
    raw = (text or "").strip().lower()
    if raw in ("inf", "+inf", "infinity", "+infinity", "+oo"):
        return oo
    if raw in ("-inf", "-infinity"):
        return -oo
    return parse_math(text)


def parse_matrix(raw: str) -> Matrix:
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        raise InvalidInput("Formato de matriz inválido. Preencha a grade corretamente.")
    if not isinstance(data, list) or not data or not all(isinstance(r, list) and r for r in data):
        raise InvalidInput("Formato de matriz inválido. Preencha a grade corretamente.")
    width = len(data[0])
    if any(len(r) != width for r in data):
        raise InvalidInput("Todas as linhas da matriz precisam ter o mesmo tamanho.")
    if len(data) > 8 or width > 8:
        raise InvalidInput("Tamanho máximo suportado: 8 x 8.")
    rows = []
    for row in data:
        # Células vazias são tratadas como zero
        rows.append([S.Zero if not str(c).strip() else parse_math(c) for c in row])
    return Matrix(rows)



def to_text(value: Any) -> str:
    try:
        return sstr(value)
    except Exception:
        return str(value)


def tx(value: Any) -> str:
    try:
        return latex(value)
    except Exception:
        return to_text(value)


def matrix_tex(M: Matrix, split: Optional[int] = None) -> str:
    """LaTeX de uma matriz; com `split` desenha a barra de matriz aumentada."""
    if split is None:
        return latex(M)
    rows, cols = M.shape
    colspec = "c" * split + "|" + "c" * (cols - split)
    body = r" \\ ".join(" & ".join(latex(M[i, j]) for j in range(cols)) for i in range(rows))
    return r"\left[\begin{array}{" + colspec + "} " + body + r" \end{array}\right]"


def normalize_set_output(value: Any) -> list[str]:
    if value is None:
        return []
    try:
        if value == S.EmptySet:
            return []
    except Exception:
        pass
    try:
        if hasattr(value, "is_FiniteSet") and value.is_FiniteSet:
            return [to_text(v) for v in value]
    except Exception:
        pass
    try:
        if isinstance(value, (list, tuple, set)):
            return [to_text(v) for v in value]
    except Exception:
        pass
    return [to_text(value)]


def normalize_interval_set(value: Any) -> list[str]:
    if value is None:
        return []
    try:
        if value == S.EmptySet:
            return []
    except Exception:
        pass
    if getattr(value, "is_Union", False):
        try:
            return [to_text(arg) for arg in value.args]
        except Exception:
            return [to_text(value)]
    return [to_text(value)]


def safe_real_number(expr: Any) -> Optional[float]:
    try:
        n = complex(expr.evalf())
        if abs(n.imag) < 1e-9 and math.isfinite(n.real):
            return float(n.real)
        return None
    except Exception:
        return None


def try_build_point(func_expr, symbol: Symbol, x_value_expr) -> Optional[str]:
    try:
        y_expr = simplify(func_expr.subs(symbol, x_value_expr))
        return f"({to_text(x_value_expr)}, {to_text(y_expr)})"
    except Exception:
        return None



def analyze_function(expr, x: Symbol) -> dict:
    f1 = simplify(diff(expr, x))
    f2 = simplify(diff(f1, x))
    analysis = {
        "mode_message": "Estudo de função calculado no domínio real.",
        "domain": "Reais com exclusões onde a função não existe.",
        "domain_intervals": [],
        "first_derivative": to_text(f1),
        "second_derivative": to_text(f2),
        "critical_points": [],
        "stationary_points": [],
        "inflection_candidates": [],
        "singularities": [],
        "increasing_intervals": [],
        "decreasing_intervals": [],
        "concave_up_intervals": [],
        "concave_down_intervals": [],
        "local_maxima": [],
        "local_minima": [],
        "vertical_asymptotes": [],
    }

    try:
        sing = singularities(expr, x, domain=S.Reals)
        analysis["singularities"] = normalize_set_output(sing)
        analysis["vertical_asymptotes"] = normalize_set_output(sing)
    except Exception:
        pass

    try:
        critical = solveset(Eq(f1, 0), x, domain=S.Reals)
        critical_points = normalize_set_output(critical)
        analysis["critical_points"] = critical_points
        stationary_points = []
        local_maxima = []
        local_minima = []
        for cp in critical_points:
            try:
                cp_expr = parse_math(cp)
                point_text = try_build_point(expr, x, cp_expr)
                if point_text:
                    stationary_points.append(point_text)
                second_value = simplify(f2.subs(x, cp_expr))
                second_num = safe_real_number(second_value)
                if second_num is not None and point_text:
                    if second_num < 0:
                        local_maxima.append(point_text)
                    elif second_num > 0:
                        local_minima.append(point_text)
            except Exception:
                continue
        analysis["stationary_points"] = stationary_points
        analysis["local_maxima"] = local_maxima
        analysis["local_minima"] = local_minima
    except Exception:
        analysis["mode_message"] = (
            "Estudo de função parcial calculado; alguns pontos críticos não puderam ser representados de forma finita."
        )

    for key, condition in (
        ("inflection_candidates", None),
        ("increasing_intervals", f1 > 0),
        ("decreasing_intervals", f1 < 0),
        ("concave_up_intervals", f2 > 0),
        ("concave_down_intervals", f2 < 0),
    ):
        try:
            if key == "inflection_candidates":
                analysis[key] = normalize_set_output(solveset(Eq(f2, 0), x, domain=S.Reals))
            else:
                analysis[key] = normalize_interval_set(solveset(condition, x, domain=S.Reals))
        except Exception:
            pass

    return analysis



MAX_RECORDED_STEPS = 24


def row_op_text(i: int, r: int, factor_value) -> str:
    """Texto de 'Li ← Li − f·Lr' (usa + quando o fator é negativo)."""
    if factor_value.is_negative:
        sign, mag = "+", -factor_value
    else:
        sign, mag = "−", factor_value
    coef = "" if mag == 1 else f"({to_text(mag)})·"
    return f"L{i + 1} ← L{i + 1} {sign} {coef}L{r + 1}"


def gauss_jordan(A: Matrix, pivot_cols: Optional[int] = None, split: Optional[int] = None):
    """Gauss-Jordan exato. Devolve (matriz final, colunas pivô, passos)."""
    M = A.copy()
    rows, cols = M.shape
    pivot_cols = cols if pivot_cols is None else pivot_cols
    steps: list = []
    pivots: list[int] = []
    skipped = False

    def record(title: str):
        nonlocal skipped
        if len(steps) < MAX_RECORDED_STEPS:
            steps.append(step(title, matrix_tex(M, split)))
        else:
            skipped = True

    r = 0
    for c in range(pivot_cols):
        if r >= rows:
            break
        p = next((i for i in range(r, rows) if simplify(M[i, c]) != 0), None)
        if p is None:
            continue
        if p != r:
            M.row_swap(r, p)
            record(f"L{r + 1} ↔ L{p + 1}")
        pv = M[r, c]
        if pv != 1:
            M[r, :] = (M[r, :] / pv).applyfunc(simplify)
            record(f"L{r + 1} ← ({to_text(1 / pv)})·L{r + 1}")
        for i in range(rows):
            if i != r and simplify(M[i, c]) != 0:
                f = M[i, c]
                M[i, :] = (M[i, :] - f * M[r, :]).applyfunc(simplify)
                record(row_op_text(i, r, f))
        pivots.append(c)
        r += 1

    if skipped:
        steps.append(step("Operações restantes omitidas", note="Exibimos apenas as primeiras operações elementares."))
    return M, pivots, steps


def determinant_steps(M: Matrix) -> list:
    n = M.rows
    steps = [step("Matriz", matrix_tex(M))]
    if n == 1:
        steps.append(step("Ordem 1: o determinante é o próprio elemento", rf"\det A = {tx(M[0, 0])}"))
    elif n == 2:
        a, b, c, d = M[0, 0], M[0, 1], M[1, 0], M[1, 1]
        steps.append(
            step(
                "Fórmula 2×2: ad − bc",
                rf"\det A = \left({tx(a)}\right)\left({tx(d)}\right) - \left({tx(b)}\right)\left({tx(c)}\right)",
            )
        )
    elif n <= 4:
        parts = []
        details = []
        for j in range(n):
            a = M[0, j]
            if a == 0:
                continue
            minor = M.minor_submatrix(0, j)
            sign = "+" if j % 2 == 0 else "-"
            parts.append(rf"{sign} \left({tx(a)}\right)\det{tx(minor)}")
            details.append(
                step(
                    f"Menor da coluna {j + 1}",
                    rf"\det{tx(minor)} = {tx(simplify(minor.det()))}",
                )
            )
        expansion = " ".join(parts).lstrip("+ ").strip() if parts else "0"
        steps.append(
            step(
                "Expansão de Laplace pela 1ª linha",
                rf"\det A = {expansion}",
                "Termos com elemento zero foram omitidos.",
            )
        )
        steps.extend(details)
    else:
        steps.append(step("Matriz grande", note="Para ordem ≥ 5 o determinante é calculado por eliminação, sem detalhar os passos."))
    steps.append(step("Resultado", rf"\det A = {tx(simplify(M.det()))}"))
    return steps


def solve_alglin(operation: str, M: Matrix) -> dict:
    square_ops = {"Determinante", "Matriz Inversa", "Traço", "Autovalores e Autovetores", "Diagonalização"}
    if operation in square_ops and not M.is_square:
        return fail("A matriz precisa ser quadrada para esta operação.")

    if operation == "Determinante":
        det = simplify(M.det())
        return ok(to_text(det), tx(det), determinant_steps(M))

    if operation == "Matriz Inversa":
        if simplify(M.det()) == 0:
            return fail("A matriz não é invertível (determinante = 0).")
        n = M.rows
        aug = M.row_join(eye(n))
        steps = [step("Matriz aumentada [A | I]", matrix_tex(aug, n))]
        final, _, gj_steps = gauss_jordan(aug, pivot_cols=n, split=n)
        steps.extend(gj_steps)
        inverse = final[:, n:].applyfunc(simplify)
        steps.append(step("A⁻¹ é o bloco da direita", rf"A^{{-1}} = {matrix_tex(inverse)}"))
        return ok(to_text(inverse), rf"A^{{-1}} = {matrix_tex(inverse)}", steps)

    if operation == "Escalonamento":
        final, _, steps = gauss_jordan(M)
        steps.insert(0, step("Matriz inicial", matrix_tex(M)))
        steps.append(step("Forma escalonada reduzida (RREF)", matrix_tex(final)))
        return ok(to_text(final), matrix_tex(final), steps)

    if operation == "Sistema Linear":
        if M.cols < 2:
            return fail("Use a última coluna como termos independentes: a matriz precisa ter pelo menos 2 colunas.")
        n = M.cols - 1
        final, pivots, steps = gauss_jordan(M, pivot_cols=n, split=n)
        steps.insert(0, step("Matriz ampliada [A | b]", matrix_tex(M, n)))
        inconsistent = any(
            all(final[i, j] == 0 for j in range(n)) and final[i, n] != 0 for i in range(final.rows)
        )
        if inconsistent:
            steps.append(step("Há uma linha 0 = c (c ≠ 0)", note="O sistema é impossível."))
            return ok("Sistema impossível (sem solução).", r"\text{Sistema impossível}", steps)
        xs = symbols(f"x1:{n + 1}")
        A, b = M[:, :n], M[:, n]
        solution = next(iter(linsolve((A, b), *xs)))
        kind = "Sistema possível e determinado (solução única)." if len(pivots) == n else "Sistema possível e indeterminado (infinitas soluções)."
        text = "\n".join(f"{x} = {to_text(v)}" for x, v in zip(xs, solution))
        tex = r"\begin{aligned} " + r" \\ ".join(f"{tx(x)} &= {tx(v)}" for x, v in zip(xs, solution)) + r" \end{aligned}"
        steps.append(step(kind, tex))
        return ok(f"{kind}\n{text}", tex, steps)

    if operation == "Posto":
        _, pivots, steps = gauss_jordan(M)
        steps.insert(0, step("Matriz inicial", matrix_tex(M)))
        steps.append(step("Posto = número de pivôs", rf"\operatorname{{posto}}(A) = {len(pivots)}"))
        return ok(str(len(pivots)), rf"\operatorname{{posto}}(A) = {len(pivots)}", steps)

    if operation == "Núcleo":
        final, pivots, steps = gauss_jordan(M)
        steps.insert(0, step("Matriz inicial", matrix_tex(M)))
        steps.append(step("Forma escalonada reduzida", matrix_tex(final)))
        basis = M.nullspace()
        nullity = M.cols - len(pivots)
        steps.append(
            step(
                "Teorema do posto-nulidade",
                rf"\dim N(A) = n - \operatorname{{posto}}(A) = {M.cols} - {len(pivots)} = {nullity}",
            )
        )
        if not basis:
            return ok("Núcleo = {0} (dimensão 0).", r"N(A) = \{\mathbf{0}\}", steps)
        vecs = ", ".join(matrix_tex(v.applyfunc(simplify)) for v in basis)
        text = f"Dimensão do núcleo: {len(basis)}\nBase:\n" + "\n".join(to_text(v.applyfunc(simplify)) for v in basis)
        return ok(text, rf"N(A) = \operatorname{{span}}\left\{{ {vecs} \right\}}", steps)

    if operation == "Transposta":
        T = M.T
        return ok(to_text(T), rf"A^T = {matrix_tex(T)}", [step("Linhas viram colunas", rf"A = {matrix_tex(M)} \;\Rightarrow\; A^T = {matrix_tex(T)}")])

    if operation == "Traço":
        diag = " + ".join(tx(M[i, i]) for i in range(M.rows))
        trace = simplify(M.trace())
        return ok(
            to_text(trace),
            rf"\operatorname{{tr}}(A) = {tx(trace)}",
            [step("Soma da diagonal principal", rf"\operatorname{{tr}}(A) = {diag} = {tx(trace)}")],
        )

    if operation == "Decomposição LU":
        try:
            L, U, perm = M.LUdecomposition()
        except Exception:
            return fail("Não foi possível calcular a decomposição LU desta matriz.")
        if perm:
            P = eye(M.rows).permuteFwd(perm)
            tex = rf"PA = LU,\quad P = {matrix_tex(P)},\; L = {matrix_tex(L)},\; U = {matrix_tex(U)}"
            text = f"P =\n{to_text(P)}\nL =\n{to_text(L)}\nU =\n{to_text(U)}"
            note = "Foram necessárias trocas de linhas, por isso aparece a matriz de permutação P."
        else:
            tex = rf"A = LU,\quad L = {matrix_tex(L)},\; U = {matrix_tex(U)}"
            text = f"L =\n{to_text(L)}\nU =\n{to_text(U)}"
            note = "L é triangular inferior (com 1 na diagonal) e U é triangular superior."
        return ok(text, tex, [step("Decomposição", tex, note)])

    if operation == "Autovalores e Autovetores":
        lam = Symbol("lambda")
        poly = (M - lam * eye(M.rows)).det()
        poly_factored = factor(poly)
        steps = [
            step("Polinômio característico: det(A − λI)", rf"p(\lambda) = {tx(simplify(poly))}"),
            step("Fatorando", rf"p(\lambda) = {tx(poly_factored)}"),
        ]
        out_lines, tex_lines = [], []
        for evalue, mult, evects in M.eigenvects():
            out_lines.append(f"Autovalor: {to_text(evalue)} (multiplicidade algébrica: {mult})")
            out_lines.append("Autovetor(es) base:")
            vecs = [v.applyfunc(simplify) for v in evects]
            out_lines.extend(to_text(v) for v in vecs)
            out_lines.append("")
            vtex = ",\\; ".join(matrix_tex(v) for v in vecs)
            tex_lines.append(rf"\lambda = {tx(evalue)}\ (m={mult}):\quad {vtex}")
            steps.append(
                step(
                    f"Autovetores de λ = {to_text(evalue)}",
                    rf"(A - {tx(evalue)}I)\mathbf{{v}} = \mathbf{{0}} \;\Rightarrow\; {vtex}",
                )
            )
        tex = r"\begin{aligned} " + r" \\ ".join(tex_lines) + r" \end{aligned}"
        return ok("\n".join(out_lines).strip(), tex, steps)

    if operation == "Diagonalização":
        try:
            P, D = M.diagonalize()
        except Exception:
            return ok(
                "A matriz não é diagonalizável (faltam autovetores independentes).",
                r"\text{A matriz não é diagonalizável}",
                [step("Autovetores insuficientes", note="A soma das dimensões dos autoespaços é menor que n.")],
            )
        P, D = P.applyfunc(simplify), D.applyfunc(simplify)
        tex = rf"A = PDP^{{-1}},\quad P = {matrix_tex(P)},\; D = {matrix_tex(D)}"
        text = f"P =\n{to_text(P)}\nD =\n{to_text(D)}"
        steps = [
            step("Colunas de P: autovetores", rf"P = {matrix_tex(P)}"),
            step("D: autovalores na diagonal", rf"D = {matrix_tex(D)}"),
            step("Relação final", r"A = P\,D\,P^{-1}"),
        ]
        return ok(text, tex, steps)

    return fail(f"Operação não suportada em Álgebra Linear: {operation}")


def derivative_rule(term, x: Symbol) -> str:
    if not term.has(x):
        return "Derivada de constante"
    if term == x:
        return "Derivada de x"
    if term.is_Add:
        return "Regra da soma"
    if term.is_Pow and term.as_base_exp()[0] == x and not term.as_base_exp()[1].has(x):
        return "Regra da potência"
    if len(term.args) == 1 and term.args[0] == x:
        return "Derivada de função elementar"
    coef, rest = term.as_independent(x)
    if coef != 1 and rest != 1:
        return "Constante multiplicativa sai da derivada"
    _, den = term.as_numer_denom()
    if den.has(x):
        return "Regra do quociente"
    if term.is_Mul:
        return "Regra do produto"
    if term.is_Pow:
        base, exp = term.as_base_exp()
        if base == x and not exp.has(x):
            return "Regra da potência"
        if not exp.has(x):
            return "Regra da potência com cadeia"
        return "Derivada exponencial generalizada"
    return "Regra da cadeia"


def derivative_steps(expr, x: Symbol, order: int) -> tuple:
    steps = [step("Função", rf"f({tx(x)}) = {tx(expr)}")]
    current = expr
    for k in range(1, order + 1):
        nxt = diff(current, x)
        label = "f'" if k == 1 else (f"f^{{({k})}}")
        label_text = "Derivada" if order == 1 else f"Derivada de ordem {k}"
        if current.is_Add and len(current.args) <= 8:
            pieces = " + ".join(rf"\frac{{d}}{{d{tx(x)}}}\left({tx(t)}\right)" for t in current.args)
            steps.append(step(f"{label_text}: regra da soma", rf"\frac{{d}}{{d{tx(x)}}}\left({tx(current)}\right) = {pieces}"))
            for t in current.args:
                steps.append(
                    step(
                        derivative_rule(t, x),
                        rf"\frac{{d}}{{d{tx(x)}}}\left({tx(t)}\right) = {tx(diff(t, x))}",
                    )
                )
        else:
            steps.append(
                step(
                    f"{label_text}: {derivative_rule(current, x).lower()}",
                    rf"\frac{{d}}{{d{tx(x)}}}\left({tx(current)}\right) = {tx(nxt)}",
                )
            )
        simplified = simplify(nxt)
        if simplified != nxt:
            steps.append(step("Simplificando", rf"{label}({tx(x)}) = {tx(simplified)}"))
        else:
            steps.append(step("Resultado parcial", rf"{label}({tx(x)}) = {tx(simplified)}"))
        current = simplified
    return current, steps


def int_arg(expr) -> str:
    """LaTeX do integrando, com parênteses quando é uma soma."""
    return rf"\left({tx(expr)}\right)" if expr.is_Add else tx(expr)


def integral_rule(term, x: Symbol) -> str:
    coef, rest = term.as_independent(x)
    if not term.has(x):
        return "Integral de constante"
    if rest == 1 / x:
        return "Integral de 1/x (logaritmo)"
    if rest.is_Pow and rest.as_base_exp()[0] == x and not rest.as_base_exp()[1].has(x):
        return "Regra da potência"
    if rest == x:
        return "Regra da potência"
    if rest.func.__name__ in ("exp",) and rest.args[0] == x:
        return "Integral da exponencial"
    if rest.func.__name__ in ("sin", "cos") and rest.args[0] == x:
        return "Integral trigonométrica básica"
    return "Integração direta (técnica escolhida pelo SymPy)"


def integral_steps(expr, x: Symbol, definite: bool, lower, upper):
    steps = [step("Integrando", rf"\int {int_arg(expr)}\,d{tx(x)}")]
    F = integrate(expr, x)
    if F.has(Integral):
        raise InvalidInput("Não foi possível encontrar a antiderivada desta função.")
    if expr.is_Add and len(expr.args) <= 8:
        pieces = " + ".join(rf"\int {tx(t)}\,d{tx(x)}" for t in expr.args)
        steps.append(step("Linearidade: integra-se termo a termo", rf"\int {int_arg(expr)}\,d{tx(x)} = {pieces}"))
        for t in expr.args:
            steps.append(
                step(
                    integral_rule(t, x),
                    rf"\int {int_arg(t)}\,d{tx(x)} = {tx(simplify(integrate(t, x)))}",
                )
            )
    else:
        steps.append(step(integral_rule(expr, x), rf"\int {int_arg(expr)}\,d{tx(x)} = {tx(simplify(F))}"))
    F = simplify(F)
    if not definite:
        steps.append(step("Constante de integração", rf"{tx(F)} + C"))
        return F, steps, False
    steps.append(step("Antiderivada F(x)", rf"F({tx(x)}) = {tx(F)}"))
    try:
        upper_val, lower_val = F.subs(x, upper), F.subs(x, lower)
        if not any(v.has(zoo, oo, -oo, S.NaN) for v in (upper_val, lower_val)):
            steps.append(
                step(
                    "Teorema Fundamental: F(b) − F(a)",
                    rf"\left. F \right|_{{{tx(lower)}}}^{{{tx(upper)}}} = \left({tx(simplify(upper_val))}\right) - \left({tx(simplify(lower_val))}\right)",
                )
            )
    except Exception:
        pass
    value = simplify(integrate(expr, (x, lower, upper)))
    return value, steps, True


def solve_calculus(request: CalculateRequest) -> dict:
    operation = (request.operation or "").strip()
    variable_name = (request.variable or "x").strip() or "x"
    if not re.fullmatch(r"[A-Za-z][A-Za-z0-9_]{0,15}", variable_name) or "__" in variable_name:
        raise InvalidInput("Nome de variável inválido.")
    x = Symbol(variable_name)
    expr = parse_math(request.expression)

    if operation == "Derivada":
        order = max(1, min(request.order or 1, 5))
        result, steps = derivative_steps(expr, x, order)
        prime = "f'" if order == 1 else f"f^{{({order})}}"
        return ok(to_text(result), rf"{prime}({tx(x)}) = {tx(result)}", steps)

    if operation == "Integral":
        if request.definite_integral:
            if not request.lower_bound or not request.upper_bound:
                return fail("Limites inferior e superior são obrigatórios.")
            lower, upper = parse_point(request.lower_bound), parse_point(request.upper_bound)
            value, steps, _ = integral_steps(expr, x, True, lower, upper)
            tex = rf"\int_{{{tx(lower)}}}^{{{tx(upper)}}} {int_arg(expr)}\,d{tx(x)} = {tx(value)}"
            steps.append(step("Resultado", tex))
            return ok(to_text(value), tex, steps)
        F, steps, _ = integral_steps(expr, x, False, None, None)
        return ok(f"{to_text(F)} + C", rf"\int {int_arg(expr)}\,d{tx(x)} = {tx(F)} + C", steps)

    if operation == "Limite":
        if not request.point:
            return fail("O ponto do limite é obrigatório.")
        a = parse_point(request.point)
        direction = request.direction or "+"
        steps = [step("Limite pedido", rf"\lim_{{{tx(x)} \to {tx(a)}{'^+' if direction == '+' else '^-' if direction == '-' else ''}}} {tx(expr)}")]
        if a not in (oo, -oo):
            direct = expr.subs(x, a)
            if direct.has(S.NaN):
                steps.append(step("Substituição direta", note="Resulta em indeterminação (0/0, ∞/∞, …): é preciso calcular o limite."))
            elif direct.has(zoo):
                steps.append(step("Substituição direta", note="Resulta em divisão por zero: analise o comportamento ao redor do ponto."))
            else:
                steps.append(step("Substituição direta", rf"f({tx(a)}) = {tx(simplify(direct))}", "A função é contínua neste ponto."))
        if direction == "both" and a not in (oo, -oo):
            right = simplify(limit(expr, x, a, dir="+"))
            left = simplify(limit(expr, x, a, dir="-"))
            steps.append(step("Limite lateral à direita", rf"\lim_{{{tx(x)} \to {tx(a)}^+}} f = {tx(right)}"))
            steps.append(step("Limite lateral à esquerda", rf"\lim_{{{tx(x)} \to {tx(a)}^-}} f = {tx(left)}"))
            if simplify(right - left) != 0:
                steps.append(step("Laterais diferentes", note="O limite bilateral não existe."))
                return ok("O limite não existe (limites laterais diferentes).", r"\text{O limite não existe}", steps)
            value = right
        elif direction in ("+", "-") and a not in (oo, -oo):
            value = simplify(limit(expr, x, a, dir=direction))
        else:
            value = simplify(limit(expr, x, a))
        side = "^+" if direction == "+" else "^-" if direction == "-" else ""
        tex = rf"\lim_{{{tx(x)} \to {tx(a)}{side if a not in (oo, -oo) else ''}}} {tx(expr)} = {tx(value)}"
        steps.append(step("Resultado", tex))
        return ok(to_text(value), tex, steps)

    if operation == "Raízes":
        solutions = solveset(Eq(expr, 0), x, domain=S.Reals)
        factored = factor(expr)
        steps = [step("Equação", rf"{tx(expr)} = 0")]
        if factored != expr:
            steps.append(step("Fatorando", rf"{tx(factored)} = 0"))
        items = normalize_set_output(solutions)
        if not items:
            return ok("Não há raízes reais.", r"\text{Não há raízes reais}", steps + [step("Conjunto solução", r"\varnothing")])
        steps.append(step("Conjunto solução (reais)", tx(solutions)))
        return ok("\n".join(f"{variable_name} = {i}" for i in items), rf"{tx(x)} \in {tx(solutions)}", steps)

    if operation == "Reta Tangente":
        if not request.point:
            return fail("Informe o ponto de tangência.")
        a = parse_math(request.point)
        fa = simplify(expr.subs(x, a))
        fp = simplify(diff(expr, x))
        slope = simplify(fp.subs(x, a))
        if any(v.has(zoo, oo, -oo, S.NaN) for v in (fa, slope)):
            return fail("A função ou a derivada não está definida neste ponto.")
        line = simplify(slope * (x - a) + fa)
        steps = [
            step("Valor da função no ponto", rf"f({tx(a)}) = {tx(fa)}"),
            step("Derivada", rf"f'({tx(x)}) = {tx(fp)}"),
            step("Coeficiente angular", rf"m = f'({tx(a)}) = {tx(slope)}"),
            step("Equação da reta", rf"y - {tx(fa)} = {tx(slope)}\left({tx(x)} - {tx(a)}\right)"),
            step("Forma reduzida", rf"y = {tx(line)}"),
        ]
        return ok(f"y = {to_text(line)}", rf"y = {tx(line)}", steps)

    if operation == "Estudo de Função":
        free_symbols = list(expr.free_symbols)
        if len(free_symbols) == 0:
            analysis = {
                "mode_message": "Expressão constante no domínio real.",
                "domain": "Reais",
                "domain_intervals": ["Reals"],
                "first_derivative": "0",
                "second_derivative": "0",
                "critical_points": [],
                "stationary_points": [],
                "inflection_candidates": [],
                "singularities": [],
                "increasing_intervals": [],
                "decreasing_intervals": [],
                "concave_up_intervals": [],
                "concave_down_intervals": [],
                "local_maxima": [],
                "local_minima": [],
                "vertical_asymptotes": [],
            }
            return ok(to_text(expr), tx(expr), analysis=analysis)
        if len(free_symbols) > 1:
            return fail("Estudo de função suporta apenas funções reais de uma variável.")
        analysis = analyze_function(expr, free_symbols[0])
        return ok("Estudo de função concluído.", analysis=analysis)

    return fail(f"Operação de Cálculo não suportada: {operation}")



# Rotas

@app.get("/")
def root():
    return {"message": "DDX Math API online"}


def calculate(request: CalculateRequest):
    try:
        operation = (request.operation or "").strip()
        if request.mode == "alglin":
            return solve_alglin(operation, parse_matrix(request.expression))
        return solve_calculus(request)
    except InvalidInput as exc:
        return fail(str(exc))
    except Exception as exc:
        return fail(f"Erro interno: {exc}")