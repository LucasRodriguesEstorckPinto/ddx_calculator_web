import re

from sympy import (
    Eq,
    Integral,
    S,
    Symbol,
    diff,
    factor,
    integrate,
    limit,
    oo,
    simplify,
    solveset,
    zoo,
)
from sympy.calculus.singularities import singularities
from formatting import (
    normalize_interval_set,
    normalize_set_output,
    safe_real_number,
    to_text,
    try_build_point,
    tx,
)
from parsing import InvalidInput, parse_math, parse_point
from responses import fail, ok, step
from schemas import CalculateRequest


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
            if right != left and simplify(right - left) != 0:
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