import pytest
from sympy import Integer, Interval, Matrix, S, Symbol, Union, oo, sin

from main import (
    gauss_jordan,
    matrix_tex,
    normalize_interval_set,
    normalize_set_output,
    row_op_text,
    safe_real_number,
    to_text,
    try_build_point,
)

x = Symbol("x")


def test_normalize_set_output_handles_empty_finite_and_other_values():
    assert normalize_set_output(None) == []
    assert normalize_set_output(S.EmptySet) == []
    assert sorted(normalize_set_output(S({1, 2}))) == ["1", "2"]
    assert normalize_set_output([1, 2]) == ["1", "2"]
    assert normalize_set_output(Interval(0, 1)) == ["Interval(0, 1)"]


def test_normalize_interval_set_splits_unions():
    union = Union(Interval(-oo, 0, True, True), Interval(1, oo, True, True))
    assert len(normalize_interval_set(union)) == 2
    assert normalize_interval_set(None) == []
    assert normalize_interval_set(S.EmptySet) == []
    assert normalize_interval_set(Interval(0, 1)) == ["Interval(0, 1)"]


def test_safe_real_number():
    assert safe_real_number(Integer(3)) == 3.0
    assert safe_real_number(S.ImaginaryUnit) is None
    assert safe_real_number(oo) is None
    assert safe_real_number("not an expression") is None


def test_try_build_point():
    assert try_build_point(x**2, x, Integer(3)) == "(3, 9)"
    assert try_build_point(x**2, x, object()) is None


def test_to_text_falls_back_to_str():
    class Broken:
        def __str__(self):
            return "broken"

    assert to_text(Broken()) == "broken"


def test_matrix_tex_draws_augmentation_bar():
    tex = matrix_tex(Matrix([[1, 2, 3], [4, 5, 6]]), split=2)
    assert "{cc|c}" in tex
    assert "&" in tex


@pytest.mark.parametrize(
    "factor_value, expected",
    [
        (Integer(3), "L2 ← L2 − (3)·L1"),
        (Integer(1), "L2 ← L2 − L1"),
        (Integer(-2), "L2 ← L2 + (2)·L1"),
    ],
)
def test_row_op_text(factor_value, expected):
    assert row_op_text(1, 0, factor_value) == expected


def test_gauss_jordan_returns_pivots_and_rref():
    matrix = Matrix([[1, 2, 3], [2, 4, 7]])
    final, pivots, steps = gauss_jordan(matrix)
    assert final == matrix.rref()[0]
    assert pivots == [0, 2]
    assert steps


def test_function_study_of_rational_function(calculate):
    data = calculate(operation="Estudo de Função", expression="1/x")
    analysis = data["analysis"]
    assert analysis["vertical_asymptotes"] == ["0"]
    assert analysis["decreasing_intervals"]
    assert analysis["concave_up_intervals"]
    assert analysis["concave_down_intervals"]


def test_function_study_with_non_finite_critical_points(calculate):
    data = calculate(operation="Estudo de Função", expression="sin(x)")
    assert data["success"] is True
    assert data["analysis"]["first_derivative"] == "cos(x)"