import json
import math
from typing import Optional, Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sympy import S, Eq, Symbol, diff, integrate, limit, simplify, solveset, sympify, Matrix, interpolate, oo, summation
from sympy.calculus.singularities import singularities
from sympy.core.sympify import SympifyError
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
    mode: Optional[str] = "calc1" # Novo campo para o roteamento
    expression: str
    operation: str
    variable: Optional[str] = "x"
    point: Optional[str] = None
    direction: Optional[str] = "+"
    order: Optional[int] = 1
    definite_integral: Optional[bool] = False
    lower_bound: Optional[str] = None
    upper_bound: Optional[str] = None
    num_terms: Optional[int] = 5 # Quantidade de termos a exibir para sequências/séries

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

# Deduz a fórmula do termo geral caso a entrada seja uma lista numérica
def infer_general_term(terms, n_symbol: Symbol):
    if not terms or len(terms) < 2:
        return None

    # Tenta PA (Diferença constante)
    try:
        diffs = [terms[i+1] - terms[i] for i in range(len(terms)-1)]
        if all(simplify(d - diffs[0]) == 0 for d in diffs):
            d = diffs[0]
            a1 = terms[0]
            return simplify(a1 + (n_symbol - 1) * d)
    except Exception:
        pass

    # Tenta PG (Razão constante)
    try:
        if all(t != 0 for t in terms):
            ratios = [terms[i+1] / terms[i] for i in range(len(terms)-1)]
            if all(simplify(r - ratios[0]) == 0 for r in ratios):
                q = ratios[0]
                a1 = terms[0]
                return simplify(a1 * (q ** (n_symbol - 1)))
    except Exception:
        pass

    # Tenta Interpolação Polinomial de Lagrange
    try:
        x_vals = list(range(1, len(terms) + 1))
        poly_expr = simplify(interpolate(list(zip(x_vals, terms)), n_symbol))
        
        is_poly_correct = True
        for idx, term in enumerate(terms, start=1):
            if simplify(poly_expr.subs(n_symbol, idx) - term) != 0:
                is_poly_correct = False
                break
                
        if is_poly_correct:
            return poly_expr
    except Exception:
        pass

    return None

# Analisa a convergência e gera os primeiros termos de uma sequência
def analyze_sequence(expr_or_terms, n_symbol: Symbol, num_terms: int = 5) -> dict:
    inferred = False
    
    if isinstance(expr_or_terms, (list, tuple)):
        inferred_expr = infer_general_term(expr_or_terms, n_symbol)
        if inferred_expr is None:
            return {
                "error": "Não foi possível deduzir um padrão (PA, PG ou Polinomial) para os termos fornecidos."
            }
        expr = inferred_expr
        inferred = True
    else:
        raw_expr = expr_or_terms
        free_syms = list(raw_expr.free_symbols)
        if free_syms:
            expr = raw_expr.subs(free_syms[0], n_symbol)
        else:
            expr = raw_expr

    lim_val = simplify(limit(expr, n_symbol, oo))
    lim_text = to_text(lim_val)
    
    is_convergent = False
    if lim_val not in (oo, -oo, S.ComplexInfinity) and not lim_val.has(Symbol):
        is_convergent = True

    first_terms = []
    for k in range(1, num_terms + 1):
        try:
            val = simplify(expr.subs(n_symbol, k))
            first_terms.append(f"a_{k} = {to_text(val)}")
        except Exception:
            first_terms.append(f"a_{k} = Indefinido")

    return {
        "general_expression": to_text(expr),
        "inferred_from_list": inferred,
        "limit_infinity": lim_text,
        "is_convergent": is_convergent,
        "status_message": f"A sequência {'converge para ' + lim_text if is_convergent else 'diverge'}." if lim_val not in (oo, -oo, S.ComplexInfinity) else "A sequência diverge.",
        "first_terms": first_terms
    }

# Analisa a convergência, aplica o Teste do Termo Geral e calcula a soma de uma série infinita
def analyze_series(expr_or_terms, n_symbol: Symbol, num_terms: int = 5) -> dict:
    inferred = False
    
    if isinstance(expr_or_terms, (list, tuple)):
        inferred_expr = infer_general_term(expr_or_terms, n_symbol)
        if inferred_expr is None:
            return {
                "error": "Não foi possível deduzir um termo geral para os termos da série."
            }
        expr = inferred_expr
        inferred = True
    else:
        raw_expr = expr_or_terms
        free_syms = list(raw_expr.free_symbols)
        if free_syms:
            expr = raw_expr.subs(free_syms[0], n_symbol)
        else:
            expr = raw_expr

    lim_an = simplify(limit(expr, n_symbol, oo))
    lim_an_text = to_text(lim_an)

    try:
        series_sum = simplify(summation(expr, (n_symbol, 1, oo)))
    except Exception:
        series_sum = S.ComplexInfinity

    sum_text = to_text(series_sum)

    test_used = "Análise da Soma / Testes da Série"
    is_convergent = False

    if lim_an != 0:
        is_convergent = False
        test_used = "Teste do Termo Geral (lim a_n ≠ 0)"
        status_message = f"A série DIVERGE pelo Teste do Termo Geral, pois lim(a_n) = {lim_an_text} ≠ 0."
    elif series_sum not in (oo, -oo, S.ComplexInfinity) and not series_sum.has(Symbol):
        is_convergent = True
        status_message = f"A série CONVERGE e sua soma é S = {sum_text}."
    elif series_sum in (oo, -oo):
        is_convergent = False
        status_message = f"A série DIVERGE (Soma S = {sum_text})."
    else:
        status_message = f"Não foi possível determinar a soma exata. O limite do termo geral é {lim_an_text}."

    first_terms = []
    partial_sum = 0
    for k in range(1, num_terms + 1):
        try:
            val = simplify(expr.subs(n_symbol, k))
            partial_sum = simplify(partial_sum + val)
            first_terms.append(f"a_{k} = {to_text(val)} (S_{k} = {to_text(partial_sum)})")
        except Exception:
            first_terms.append(f"a_{k} = Indefinido")

    return {
        "general_expression": to_text(expr),
        "inferred_from_list": inferred,
        "limit_term_general": lim_an_text,
        "series_sum": sum_text,
        "is_convergent": is_convergent,
        "test_used": test_used,
        "status_message": status_message,
        "first_terms": first_terms
    }

@app.get("/")
def root():
    return {"message": "DDX Math API online"}

@app.post("/calculate")
async def calculate(request: CalculateRequest):
    try:
        mode = request.mode
        operation = (request.operation or "").strip()

        # ==========================================
        # ROTEAMENTO PARA ÁLGEBRA LINEAR
        # ==========================================
        if mode == "alglin":
            try:
                # Transforma a string JSON (ex: [["1", "2"], ["3", "4"]]) em lista de listas
                raw_matrix = json.loads(request.expression)
            except json.JSONDecodeError:
                return {"success": False, "result": "", "error": "Formato de matriz inválido. Certifique-se de preencher a grade corretamente.", "analysis": None}
            
            parsed_matrix = []
            for row in raw_matrix:
                parsed_row = []
                for cell in row:
                    val = cell.strip()
                    # Células vazias são tratadas como zero
                    if not val:
                        parsed_row.append(S.Zero)
                    else:
                        parsed_row.append(sympify(val))
                parsed_matrix.append(parsed_row)
            
            M = Matrix(parsed_matrix)
            
            if operation == "Determinante":
                if not M.is_square:
                    return {"success": False, "result": "", "error": "A matriz precisa ser quadrada para calcular o determinante.", "analysis": None}
                return {"success": True, "result": to_text(simplify(M.det())), "error": "", "analysis": None}
            
            if operation == "Matriz Inversa":
                if not M.is_square:
                    return {"success": False, "result": "", "error": "A matriz precisa ser quadrada para possuir inversa.", "analysis": None}
                if M.det() == 0:
                    return {"success": False, "result": "", "error": "A matriz não é invertível (determinante = 0).", "analysis": None}
                return {"success": True, "result": to_text(simplify(M.inv())), "error": "", "analysis": None}
                
            if operation == "Escalonamento":
                # rref() retorna a matriz escalonada reduzida e os índices dos pivôs
                res, pivots = M.rref()
                return {"success": True, "result": to_text(res), "error": "", "analysis": None}
                
            if operation == "Autovalores e Autovetores":
                if not M.is_square:
                    return {"success": False, "result": "", "error": "A matriz precisa ser quadrada.", "analysis": None}
                
                # eigenvects retorna uma lista de tuplas: (autovalor, multiplicidade, [autovetores])
                res = M.eigenvects()
                out_str = ""
                for evalue, mult, evects in res:
                    out_str += f"Autovalor: {to_text(evalue)} (Multiplicidade Algébrica: {mult})\n"
                    out_str += "Autovetor(es) base:\n"
                    for v in evects:
                        out_str += f"{to_text(v)}\n"
                    out_str += "\n"
                return {"success": True, "result": out_str.strip(), "error": "", "analysis": None}
                
            if operation == "Sistema Linear":
                # Tratamos a grade como uma matriz ampliada [A | b] e escalonamos
                res, pivots = M.rref()
                return {"success": True, "result": f"Matriz Ampliada Escalonada Reduzida (RREF):\n{to_text(res)}", "error": "", "analysis": None}

            return {"success": False, "result": "", "error": f"Operação não suportada em Álgebra Linear: {operation}", "analysis": None}

        # ==========================================
        # ROTEAMENTO PARA SEQUÊNCIAS E SÉRIES
        # (Usa símbolo restrito: positive=True, integer=True)
        # ==========================================
        if operation in ("Sequências", "Séries"):
            variable_name = (request.variable or "n").strip() or "n"
            seq_symbol = Symbol(variable_name, positive=True, integer=True)
            num_terms = request.num_terms if request.num_terms and request.num_terms > 0 else 5
            expr_input = request.expression.strip()

            parsed_list = None
            if expr_input.startswith("[") and expr_input.endswith("]"):
                try:
                    parsed_list = [sympify(x.strip()) for x in json.loads(expr_input)]
                except Exception:
                    pass
            elif "," in expr_input:
                try:
                    parsed_list = [sympify(x.strip()) for x in expr_input.split(",")]
                except Exception:
                    pass

            target_input = parsed_list if parsed_list is not None else sympify(expr_input)

            if operation == "Sequências":
                analysis = analyze_sequence(target_input, seq_symbol, num_terms=num_terms)
                if "error" in analysis:
                    return {"success": False, "result": "", "error": analysis["error"], "analysis": None}
                result_msg = f"Termo Geral: a_n = {analysis['general_expression']} | Limite n -> oo: {analysis['limit_infinity']} ({analysis['status_message']})"
            else:
                analysis = analyze_series(target_input, seq_symbol, num_terms=num_terms)
                if "error" in analysis:
                    return {"success": False, "result": "", "error": analysis["error"], "analysis": None}
                result_msg = f"Termo Geral: a_n = {analysis['general_expression']} | Soma S = {analysis['series_sum']} ({analysis['status_message']})"

            return {
                "success": True,
                "result": result_msg,
                "error": "",
                "analysis": analysis
            }

        # ==========================================
        # ROTEAMENTO PARA CÁLCULO 1 e 2
        # ==========================================
        variable_name = (request.variable or "x").strip() or "x"
        variable_symbol = Symbol(variable_name)
        expr = sympify(request.expression)

        if operation == "Derivada":
            order = request.order or 1
            result_expr = simplify(diff(expr, variable_symbol, order))
            return {"success": True, "result": to_text(result_expr), "error": "", "analysis": None}

        if operation == "Integral":
            if request.definite_integral:
                if request.lower_bound is None or request.upper_bound is None:
                    return {"success": False, "result": "", "error": "Limites inferior e superior são obrigatórios.", "analysis": None}
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
                return {"success": False, "result": "", "error": "Estudo de função suporta apenas funções reais de uma variável.", "analysis": None}
            x = free_symbols[0]
            analysis = analyze_function(expr, x)
            return {"success": True, "result": "Estudo de função concluído.", "error": "", "analysis": analysis}

        return {"success": False, "result": "", "error": f"Operação de Cálculo não suportada: {operation}", "analysis": None}

    except SympifyError:
        return {"success": False, "result": "", "error": "Não foi possível interpretar a expressão matemática.", "analysis": None}
    except Exception as e:
        return {"success": False, "result": "", "error": f"Erro interno: {str(e)}", "analysis": None}