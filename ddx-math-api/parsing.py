import json
import re
from typing import Any, Optional

from sympy import (
    Matrix,
    S,
    oo,
)
from sympy.parsing.sympy_parser import (
    convert_xor,
    implicit_multiplication,
    parse_expr,
    standard_transformations,
)
class InvalidInput(Exception):
    pass


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
        rows.append([S.Zero if not str(c).strip() else parse_math(c) for c in row])
    return Matrix(rows)