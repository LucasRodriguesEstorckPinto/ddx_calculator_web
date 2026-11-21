import math
from typing import Any, Optional

from sympy import (
    Matrix,
    S,
    Symbol,
    latex,
    simplify,
)
from sympy.printing.str import sstr
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