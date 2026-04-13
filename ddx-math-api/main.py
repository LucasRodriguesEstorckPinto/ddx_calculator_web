from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sympy import S, Eq, Symbol, diff, integrate, limit, simplify, solveset, sympify
from sympy.calculus.singularities import singularities
from sympy.core.sympify import SympifyError
from sympy.printing.str import sstr
from typing import Optional, Any
import math

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
    expression: str
    operation: str
    variable: Optional[str] = "x"
    point: Optional[str] = None
    direction: Optional[str] = "+"
    order: Optional[int] = 1
    definite_integral: Optional[bool] = False
    lower_bound: Optional[str] = None
    upper_bound: Optional[str] = None


def to_text(value: Any) -> str:
    try:
        return sstr(value)
    except Exception:
        return str(value)


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
                cp_expr = sympify(cp)
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
        analysis["mode_message"] = "Estudo de função parcial calculado; alguns pontos críticos não puderam ser representados de forma finita."

    try:
        infl = solveset(Eq(f2, 0), x, domain=S.Reals)
        analysis["inflection_candidates"] = normalize_set_output(infl)
    except Exception:
        pass

    try:
        inc = solveset(f1 > 0, x, domain=S.Reals)
        analysis["increasing_intervals"] = normalize_interval_set(inc)
    except Exception:
        pass

    try:
        dec = solveset(f1 < 0, x, domain=S.Reals)
        analysis["decreasing_intervals"] = normalize_interval_set(dec)
    except Exception:
        pass

    try:
        cu = solveset(f2 > 0, x, domain=S.Reals)
        analysis["concave_up_intervals"] = normalize_interval_set(cu)
    except Exception:
        pass

    try:
        cd = solveset(f2 < 0, x, domain=S.Reals)
        analysis["concave_down_intervals"] = normalize_interval_set(cd)
    except Exception:
        pass

    return analysis


@app.get("/")
def root():
    return {"message": "DDX Math API online"}


@app.post("/calculate")
async def calculate(request: CalculateRequest):
    try:
        variable_name = (request.variable or "x").strip() or "x"
        variable_symbol = Symbol(variable_name)
        expr = sympify(request.expression)
        operation = (request.operation or "").strip()

        if operation == "Derivada":
            order = request.order or 1
            result_expr = simplify(diff(expr, variable_symbol, order))
            return {"success": True, "result": to_text(result_expr), "error": "", "analysis": None}

        if operation == "Integral":
            if request.definite_integral:
                if request.lower_bound is None or request.upper_bound is None:
                    return {"success": False, "result": "", "error": "Limites inferior e superior são obrigatórios para integral definida.", "analysis": None}
                lower = sympify(request.lower_bound)
                upper = sympify(request.upper_bound)
                result_expr = simplify(integrate(expr, (variable_symbol, lower, upper)))
            else:
                result_expr = simplify(integrate(expr, variable_symbol))
            return {"success": True, "result": to_text(result_expr), "error": "", "analysis": None}

        if operation == "Limite":
            if request.point is None:
                return {"success": False, "result": "", "error": "O ponto do limite é obrigatório.", "analysis": None}
            point_expr = sympify(request.point)
            if request.direction == "+":
                result_expr = simplify(limit(expr, variable_symbol, point_expr, dir="+"))
            elif request.direction == "-":
                result_expr = simplify(limit(expr, variable_symbol, point_expr, dir="-"))
            else:
                result_expr = simplify(limit(expr, variable_symbol, point_expr))
            return {"success": True, "result": to_text(result_expr), "error": "", "analysis": None}

        if operation == "Derivadas Parciais":
            result_expr = simplify(diff(expr, variable_symbol))
            return {"success": True, "result": to_text(result_expr), "error": "", "analysis": None}

        if operation == "Estudo de Função":
            free_symbols = list(expr.free_symbols)
            if len(free_symbols) == 0:
                return {"success": True, "result": to_text(expr), "error": "", "analysis": {"mode_message": "Expressão constante no domínio real.", "domain": "Reais", "domain_intervals": ["Reals"], "first_derivative": "0", "second_derivative": "0", "critical_points": [], "stationary_points": [], "inflection_candidates": [], "singularities": [], "increasing_intervals": [], "decreasing_intervals": [], "concave_up_intervals": [], "concave_down_intervals": [], "local_maxima": [], "local_minima": [], "vertical_asymptotes": []}}
            if len(free_symbols) > 1:
                return {"success": False, "result": "", "error": "Estudo de função v1 suporta apenas funções reais de uma variável.", "analysis": None}
            x = free_symbols[0]
            analysis = analyze_function(expr, x)
            return {"success": True, "result": "Estudo de função concluído.", "error": "", "analysis": analysis}

        return {"success": False, "result": "", "error": f"Operação não suportada: {operation}", "analysis": None}

    except SympifyError:
        return {"success": False, "result": "", "error": "Não foi possível interpretar a expressão matemática.", "analysis": None}
    except Exception as e:
        return {"success": False, "result": "", "error": f"Erro interno: {str(e)}", "analysis": None}
