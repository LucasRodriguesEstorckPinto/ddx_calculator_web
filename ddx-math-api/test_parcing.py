import json

import pytest
from sympy import Matrix, Symbol, cos, oo, sin

from parsing import InvalidInput, parse_math, parse_matrix, parse_point

x = Symbol("x")


@pytest.mark.parametrize(
    "text, expected",
    [
        ("x**2", x**2),
        ("x^2", x**2),
        ("2x^2 + 3x", 2 * x**2 + 3 * x),
        ("2(x + 1)", 2 * (x + 1)),
        ("sin(x)/x", sin(x) / x),
        ("  cos(x)  ", cos(x)),
    ],
)
def test_parse_math_accepts_valid_expressions(text, expected):
    assert parse_math(text) == expected


@pytest.mark.parametrize(
    "text",
    [
        "",
        "   ",
        None,
        "x" * 301,
        "__import__(1)",
        "x.__class__",
        "().__class__.__bases__",
        "x$",
        "x'",
        'x"',
        "x[0]",
        "x; y",
        "x = 1",
        "lambda: 1",
        "x +* 3",
    ],
)
def test_parse_math_rejects_invalid_or_dangerous_input(text):
    with pytest.raises(InvalidInput):
        parse_math(text)


@pytest.mark.parametrize("text", ["oo", "inf", "+inf", "INF", "∞", "infinity"])
def test_parse_point_positive_infinity(text):
    assert parse_point(text) == oo


@pytest.mark.parametrize("text", ["-oo", "-inf", "-infinity"])
def test_parse_point_negative_infinity(text):
    assert parse_point(text) == -oo


def test_parse_point_regular_value():
    assert parse_point("3") == 3


def test_parse_matrix_reads_grid_and_treats_blank_cells_as_zero():
    matrix = parse_matrix(json.dumps([["1", ""], [" ", "x"]]))
    assert matrix == Matrix([[1, 0], [0, x]])


@pytest.mark.parametrize(
    "raw",
    [
        "not json",
        "[]",
        "{}",
        "5",
        "[[]]",
        "[1, 2]",
        json.dumps([["1", "2"], ["3"]]),
        json.dumps([["1"]] * 9),
        json.dumps([["1"] * 9]),
        json.dumps([["__import__(1)"]]),
    ],
)
def test_parse_matrix_rejects_malformed_input(raw):
    with pytest.raises(InvalidInput):
        parse_matrix(raw)