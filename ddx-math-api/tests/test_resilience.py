import json
import threading
import time

import pytest
from fastapi.testclient import TestClient

from executor import ExecutorSettings
from main import create_app
from solver import run_calculation

SYMBOLIC_6X6 = json.dumps([[f"a{i}{j}" for j in range(6)] for i in range(6)])

RUNAWAY_PAYLOADS = [
    pytest.param(
        {"mode": "calc1", "operation": "Derivada", "expression": "9**9**9**9"},
        id="power-tower",
    ),
    pytest.param(
        {"mode": "calc1", "operation": "Derivada", "expression": "factorial(99999999)"},
        id="huge-factorial",
    ),
    pytest.param(
        {"mode": "alglin", "operation": "Matriz Inversa", "expression": SYMBOLIC_6X6},
        id="symbolic-inverse-6x6",
    ),
    pytest.param(
        {
            "mode": "alglin",
            "operation": "Autovalores e Autovetores",
            "expression": SYMBOLIC_6X6,
        },
        id="symbolic-eigenvalues-6x6",
    ),
]

DERIVATIVE = {"mode": "calc1", "operation": "Derivada", "expression": "x**2"}


pytestmark = pytest.mark.slow


def settings(**overrides):
    values = {
        "workers": 2,
        "timeout_seconds": 1.5,
        "queue_size": 2,
        "memory_limit_mb": 1024,
        "tasks_per_worker": 100,
    }
    return ExecutorSettings(**{**values, **overrides})


@pytest.fixture
def client_factory():
    stack = []

    def factory(**overrides):
        test_client = TestClient(create_app(settings(**overrides)))
        test_client.__enter__()
        stack.append(test_client)
        return test_client

    yield factory
    for test_client in stack:
        test_client.__exit__(None, None, None)


@pytest.mark.parametrize("payload", RUNAWAY_PAYLOADS)
def test_runaway_calculations_are_cut_off(client_factory, payload):
    client = client_factory()

    started = time.monotonic()
    response = client.post("/calculate", json=payload)
    elapsed = time.monotonic() - started

    body = response.json()
    assert response.status_code == 200
    assert body["success"] is False
    assert "tempo limite" in body["error"] or "memória" in body["error"]
    assert elapsed < 8


def test_server_keeps_answering_after_a_runaway_calculation(client_factory):
    client = client_factory()

    client.post("/calculate", json=RUNAWAY_PAYLOADS[0].values[0])
    follow_up = client.post("/calculate", json=DERIVATIVE).json()

    assert follow_up["success"] is True
    assert follow_up["result"] == "2*x"


def test_a_runaway_calculation_does_not_block_normal_ones(client_factory):
    client = client_factory(timeout_seconds=4.0)
    hostile = threading.Thread(
        target=lambda: client.post("/calculate", json=RUNAWAY_PAYLOADS[0].values[0])
    )
    hostile.start()
    time.sleep(0.5)

    started = time.monotonic()
    response = client.post("/calculate", json=DERIVATIVE).json()
    elapsed = time.monotonic() - started

    hostile.join()
    assert response["success"] is True
    assert elapsed < 3.0


def test_saturated_server_answers_503_with_retry_after(client_factory):
    client = client_factory(workers=1, queue_size=0, timeout_seconds=3.0)
    hostile = threading.Thread(
        target=lambda: client.post("/calculate", json=RUNAWAY_PAYLOADS[0].values[0])
    )
    hostile.start()
    time.sleep(0.7)

    response = client.post("/calculate", json=DERIVATIVE)

    hostile.join()
    assert response.status_code == 503
    assert response.headers["retry-after"] == "2"
    body = response.json()
    assert body["success"] is False
    assert "ocupado" in body["error"]
    assert set(body) == {"success", "result", "latex", "steps", "error", "analysis"}


def test_server_recovers_after_being_saturated(client_factory):
    client = client_factory(workers=1, queue_size=0, timeout_seconds=1.5)
    hostile = threading.Thread(
        target=lambda: client.post("/calculate", json=RUNAWAY_PAYLOADS[0].values[0])
    )
    hostile.start()
    hostile.join()

    assert client.post("/calculate", json=DERIVATIVE).json()["success"] is True


def test_internal_errors_do_not_leak_details():
    result = run_calculation({})

    assert result["success"] is False
    assert result["error"] == "Erro interno ao processar o cálculo."


def test_memory_errors_are_reported_without_crashing(monkeypatch):
    import solver

    def explode(request):
        raise MemoryError

    monkeypatch.setattr(solver, "solve", explode)

    result = run_calculation(
        {"mode": "calc1", "operation": "Derivada", "expression": "x"}
    )

    assert result["success"] is False
    assert "memória" in result["error"]