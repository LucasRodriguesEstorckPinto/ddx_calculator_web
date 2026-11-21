import pytest
from sympy import Symbol, exp, simplify, sin, sqrt, sympify

from calculus import derivative_rule, integral_rule

x = Symbol("x")


def equivalent(actual, expected):
    left, right = sympify(actual), sympify(expected)
    return left == right or simplify(left - right) == 0


@pytest.mark.parametrize(
    "expression, order, expected",
    [
        ("x**3 - 3*x + 1", 1, "3*x**2 - 3"),
        ("x**2", 2, "2"),
        ("sin(x)", 4, "sin(x)"),
        ("x**6", 5, "720*x"),
        ("x**6", 0, "6*x**5"),
        ("x**6", 99, "720*x"),
        ("2x^2 + 3x", 1, "4*x + 3"),
        ("exp(2*x)", 1, "2*exp(2*x)"),
    ],
)
def test_derivative(calculate, expression, order, expected):
    data = calculate(operation="Derivada", expression=expression, order=order)
    assert data["success"] is True
    assert equivalent(data["result"], expected)


@pytest.mark.parametrize(
    "expression, rule",
    [
        ("x**3 - 3*x + 1", "regra da soma"),
        ("x**2*sin(x)", "regra do produto"),
        ("sin(x)/x", "regra do quociente"),
        ("exp(2*x)", "regra da cadeia"),
        ("1/x", "regra da potência"),
    ],
)
def test_derivative_steps_name_the_rule_used(calculate, expression, rule):
    data = calculate(operation="Derivada", expression=expression)
    assert any(rule in item["title"].lower() for item in data["steps"])


def test_derivative_uses_chosen_variable(calculate):
    data = calculate(operation="Derivada", expression="t**2", variable="t")
    assert equivalent(data["result"], "2*t")


@pytest.mark.parametrize("variable", ["x; y", "1x", "a" * 17, "x__y", "x y", "x.y"])
def test_invalid_variable_names_are_rejected(calculate, variable):
    data = calculate(operation="Derivada", expression="x", variable=variable)
    assert data["success"] is False


def test_blank_variable_defaults_to_x(calculate):
    data = calculate(operation="Derivada", expression="x**2", variable="  ")
    assert equivalent(data["result"], "2*x")


def test_indefinite_integral_appends_constant(calculate):
    data = calculate(operation="Integral", expression="2*x")
    assert data["result"].endswith(" + C")
    assert equivalent(data["result"].removesuffix(" + C"), "x**2")
    assert data["latex"].endswith("+ C")


@pytest.mark.parametrize(
    "expression, lower, upper, expected",
    [
        ("x**2", "0", "3", "9"),
        ("exp(-x)", "0", "oo", "1"),
        ("1/x**2", "1", "oo", "1"),
        ("sin(x)", "0", "pi", "2"),
    ],
)
def test_definite_integral(calculate, expression, lower, upper, expected):
    data = calculate(
        operation="Integral",
        expression=expression,
        definite_integral=True,
        lower_bound=lower,
        upper_bound=upper,
    )
    assert equivalent(data["result"], expected)


@pytest.mark.parametrize("bounds", [{}, {"lower_bound": "0"}, {"upper_bound": "1"}])
def test_definite_integral_requires_both_bounds(calculate, bounds):
    data = calculate(
        operation="Integral", expression="x", definite_integral=True, **bounds
    )
    assert data["success"] is False


def test_integral_without_elementary_antiderivative_reports_error(calculate):
    data = calculate(operation="Integral", expression="x**x")
    assert data["success"] is False
    assert "antiderivada" in data["error"]


def test_integral_steps_split_sums_term_by_term(calculate):
    data = calculate(operation="Integral", expression="x**2 + sin(x)")
    titles = [item["title"] for item in data["steps"]]
    assert "Regra da potência" in titles
    assert "Integral trigonométrica básica" in titles


@pytest.mark.parametrize(
    "expression, point, direction, expected",
    [
        ("sin(x)/x", "0", "both", "1"),
        ("(x**2 - 1)/(x - 1)", "1", "both", "2"),
        ("1/x", "0", "+", "oo"),
        ("1/x", "0", "-", "-oo"),
        ("(2*x + 1)/(x + 3)", "oo", "+", "2"),
        ("exp(-x)", "oo", "both", "0"),
        ("1/x**2", "0", "both", "oo"),
        ("-1/x**2", "0", "both", "-oo"),
    ],
)
def test_limit(calculate, expression, point, direction, expected):
    data = calculate(
        operation="Limite", expression=expression, point=point, direction=direction
    )
    assert data["success"] is True
    assert equivalent(data["result"], expected)


def test_two_sided_limit_with_different_sides_does_not_exist(calculate):
    data = calculate(operation="Limite", expression="1/x", point="0", direction="both")
    assert data["success"] is True
    assert "não existe" in data["result"]


def test_limit_requires_a_point(calculate):
    assert calculate(operation="Limite", expression="x")["success"] is False


def test_roots(calculate):
    data = calculate(operation="Raízes", expression="x**2 - 5*x + 6")
    assert data["result"].splitlines() == ["x = 2", "x = 3"]


def test_roots_when_there_are_no_real_solutions(calculate):
    data = calculate(operation="Raízes", expression="x**2 + 1")
    assert data["result"] == "Não há raízes reais."


def test_tangent_line(calculate):
    data = calculate(operation="Reta Tangente", expression="x**2", point="2")
    assert data["result"] == "y = 4*x - 4"
    assert len(data["steps"]) == 5


def test_tangent_line_requires_a_point(calculate):
    assert calculate(operation="Reta Tangente", expression="x**2")["success"] is False


def test_tangent_line_fails_where_derivative_is_undefined(calculate):
    data = calculate(operation="Reta Tangente", expression="sqrt(x)", point="0")
    assert data["success"] is False


def test_function_study_classifies_extrema(calculate):
    data = calculate(operation="Estudo de Função", expression="x**3 - 3*x + 1")
    analysis = data["analysis"]
    assert analysis["local_maxima"] == ["(-1, 3)"]
    assert analysis["local_minima"] == ["(1, -1)"]
    assert sorted(analysis["critical_points"]) == ["-1", "1"]


def test_function_study_of_constant(calculate):
    data = calculate(operation="Estudo de Função", expression="5")
    assert data["success"] is True
    assert data["analysis"]["first_derivative"] == "0"


def test_function_study_rejects_multiple_variables(calculate):
    data = calculate(operation="Estudo de Função", expression="x*y")
    assert data["success"] is False


def test_unknown_operation_is_rejected(calculate):
    data = calculate(operation="Inexistente", expression="x")
    assert data["success"] is False
    assert "não suportada" in data["error"]


@pytest.mark.parametrize(
    "term, rule",
    [
        (sin(x), "Derivada de função elementar"),
        (x**3, "Regra da potência"),
        (sqrt(x) * exp(x), "Regra do produto"),
    ],
)
def test_derivative_rule_naming(term, rule):
    assert derivative_rule(term, x) == rule


def test_integral_rule_naming():
    assert integral_rule(1 / x, x) == "Integral de 1/x (logaritmo)"
    assert integral_rule(x**3, x) == "Regra da potência"
    assert integral_rule(exp(x), x) == "Integral da exponencial"