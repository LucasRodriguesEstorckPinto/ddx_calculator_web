from typing import Optional

from sympy import (
    Matrix,
    Symbol,
    eye,
    factor,
    linsolve,
    simplify,
    symbols,
)
from formatting import (
    matrix_tex,
    to_text,
    tx,
)
from responses import fail, ok, step


MAX_RECORDED_STEPS = 24


def row_op_text(i: int, r: int, factor_value) -> str:
    if factor_value.is_negative:
        sign, mag = "+", -factor_value
    else:
        sign, mag = "−", factor_value
    coef = "" if mag == 1 else f"({to_text(mag)})·"
    return f"L{i + 1} ← L{i + 1} {sign} {coef}L{r + 1}"


def gauss_jordan(A: Matrix, pivot_cols: Optional[int] = None, split: Optional[int] = None):
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