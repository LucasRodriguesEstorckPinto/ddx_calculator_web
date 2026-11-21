import logging

from calculus import solve_calculus
from linear_algebra import solve_alglin
from parsing import InvalidInput, parse_matrix
from responses import fail
from schemas import CalculateRequest

logger = logging.getLogger("ddx.solver")


def solve(request: CalculateRequest) -> dict:
    operation = (request.operation or "").strip()
    if request.mode == "alglin":
        return solve_alglin(operation, parse_matrix(request.expression))
    return solve_calculus(request)


def run_calculation(payload: dict) -> dict:
    try:
        return solve(CalculateRequest(**payload))
    except InvalidInput as exc:
        return fail(str(exc))
    except MemoryError:
        return fail("O cálculo excedeu o limite de memória. Simplifique a expressão.")
    except Exception:
        logger.exception("Falha inesperada ao calcular")
        return fail("Erro interno ao processar o cálculo.")