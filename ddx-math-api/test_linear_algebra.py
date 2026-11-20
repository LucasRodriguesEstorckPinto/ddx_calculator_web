import json
import random

import pytest
from sympy import Matrix, eye, sympify

from main import MAX_RECORDED_STEPS, matrix_tex

SQUARE_ONLY = [
    "Determinante",
    "Matriz Inversa",
    "Traço",
    "Autovalores e Autovetores",
    "Diagonalização",
]


def as_rows(matrix):
    return [[str(matrix[i, j]) for j in range(matrix.cols)] for i in range(matrix.rows)]


def random_matrix(rng, rows, cols):
    return Matrix(rows, cols, lambda i, j: rng.randint(-5, 5))


def invertible_matrix(rng, size):
    while True:
        candidate = random_matrix(rng, size, size)
        if candidate.det() != 0:
            return candidate


@pytest.mark.parametrize(
    "rows, expected",
    [
        ([["1", "2"], ["3", "4"]], "-2"),
        ([["5"]], "5"),
        ([["1", "0", "0"], ["0", "1", "0"], ["0", "0", "1"]], "1"),
        ([["a", "b"], ["c", "d"]], "a*d - b*c"),
        ([["", ""], ["", ""]], "0"),
    ],
)
def test_determinant(linear, rows, expected):
    assert linear("Determinante", rows)["result"] == expected


def test_determinant_expands_by_first_row_for_order_three(linear):
    rows = [["2", "1", "1"], ["1", "3", "2"], ["1", "0", "0"]]
    data = linear("Determinante", rows)
    titles = [item["title"] for item in data["steps"]]
    assert data["result"] == "-1"
    assert "Expansão de Laplace pela 1ª linha" in titles
    assert titles[-1] == "Resultado"


def test_laplace_expansion_alternates_signs(linear):
    rows = [["2", "1", "1"], ["1", "3", "2"], ["1", "0", "0"]]
    steps = linear("Determinante", rows)["steps"]
    expansion = next(item["latex"] for item in steps if item["title"].startswith("Expansão"))
    assert " - \\left(1\\right)\\det" in expansion
    assert " + \\left(1\\right)\\det" in expansion


def test_inverse_of_known_matrix(linear):
    data = linear("Matriz Inversa", [["1", "2"], ["3", "4"]])
    assert sympify(data["result"]) == Matrix([[-2, 1], [sympify("3/2"), sympify("-1/2")]])
    assert data["steps"][0]["title"] == "Matriz aumentada [A | I]"
    assert "A^{-1}" in data["steps"][-1]["latex"]


@pytest.mark.parametrize("seed", range(5))
def test_inverse_times_original_is_identity(linear, seed):
    matrix = invertible_matrix(random.Random(seed), 3)
    inverse = sympify(linear("Matriz Inversa", as_rows(matrix))["result"])
    assert matrix * inverse == eye(3)


@pytest.mark.parametrize("seed", range(5))
def test_row_reduction_matches_sympy_rref(linear, seed):
    matrix = random_matrix(random.Random(seed), 3, 4)
    data = linear("Escalonamento", as_rows(matrix))
    assert sympify(data["result"]) == matrix.rref()[0]
    assert data["steps"][-1]["latex"] == matrix_tex(matrix.rref()[0])


def test_row_reduction_records_at_most_the_step_limit(linear):
    matrix = random_matrix(random.Random(3), 6, 6)
    steps = linear("Escalonamento", as_rows(matrix))["steps"]
    assert len(steps) <= MAX_RECORDED_STEPS + 3


@pytest.mark.parametrize(
    "operation, rows, expected",
    [
        ("Posto", [["1", "2"], ["2", "4"]], "1"),
        ("Posto", [["1", "0"], ["0", "1"]], "2"),
        ("Traço", [["1", "2"], ["3", "4"]], "5"),
    ],
)
def test_scalar_results(linear, operation, rows, expected):
    assert linear(operation, rows)["result"] == expected


def test_transpose(linear):
    data = linear("Transposta", [["1", "2", "3"], ["4", "5", "6"]])
    assert sympify(data["result"]) == Matrix([[1, 4], [2, 5], [3, 6]])


def test_nullspace_of_singular_matrix(linear):
    data = linear("Núcleo", [["1", "2"], ["2", "4"]])
    assert "Dimensão do núcleo: 1" in data["result"]


def test_nullspace_of_invertible_matrix_is_trivial(linear):
    data = linear("Núcleo", [["1", "0"], ["0", "1"]])
    assert "dimensão 0" in data["result"]


def test_lu_without_pivoting(linear):
    data = linear("Decomposição LU", [["2", "1"], ["4", "5"]])
    assert data["latex"].startswith("A = LU")


def test_lu_with_row_swap_reports_permutation(linear):
    data = linear("Decomposição LU", [["0", "1"], ["1", "0"]])
    assert data["latex"].startswith("PA = LU")


def test_eigenvalues_of_diagonal_matrix(linear):
    data = linear("Autovalores e Autovetores", [["2", "0"], ["0", "3"]])
    assert "Autovalor: 2" in data["result"]
    assert "Autovalor: 3" in data["result"]


def test_diagonalization_of_diagonalizable_matrix(linear):
    data = linear("Diagonalização", [["2", "0"], ["0", "3"]])
    assert data["result"].startswith("P =")


def test_defective_matrix_is_not_diagonalizable(linear):
    data = linear("Diagonalização", [["1", "1"], ["0", "1"]])
    assert data["success"] is True
    assert "não é diagonalizável" in data["result"]


def test_linear_system_with_unique_solution(linear):
    data = linear("Sistema Linear", [["1", "1", "3"], ["1", "-1", "1"]])
    assert "determinado" in data["result"]
    assert "x1 = 2" in data["result"]
    assert "x2 = 1" in data["result"]


def test_linear_system_without_solution(linear):
    data = linear("Sistema Linear", [["1", "1", "3"], ["1", "1", "4"]])
    assert "impossível" in data["result"]


def test_linear_system_with_infinite_solutions(linear):
    data = linear("Sistema Linear", [["1", "1", "3"], ["2", "2", "6"]])
    assert "indeterminado" in data["result"]


def test_linear_system_needs_two_columns(linear):
    assert linear("Sistema Linear", [["1"], ["2"]])["success"] is False


@pytest.mark.parametrize("operation", SQUARE_ONLY)
def test_square_only_operations_reject_rectangular_matrices(linear, operation):
    data = linear(operation, [["1", "2", "3"], ["4", "5", "6"]])
    assert data["success"] is False
    assert "quadrada" in data["error"]


def test_singular_matrix_has_no_inverse(linear):
    data = linear("Matriz Inversa", [["1", "2"], ["2", "4"]])
    assert data["success"] is False
    assert "não é invertível" in data["error"]


def test_unknown_operation_is_rejected(linear):
    data = linear("Inexistente", [["1"]])
    assert data["success"] is False
    assert "não suportada" in data["error"]


def test_invalid_grid_payload_is_rejected(calculate):
    data = calculate(mode="alglin", operation="Determinante", expression="not json")
    assert data["success"] is False


def test_cells_cannot_execute_code(calculate):
    payload = json.dumps([["__import__('os').system('true')"]])
    data = calculate(mode="alglin", operation="Determinante", expression=payload)
    assert data["success"] is False