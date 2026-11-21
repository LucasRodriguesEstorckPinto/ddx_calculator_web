import json

import pytest

RESPONSE_KEYS = {"success", "result", "latex", "steps", "error", "analysis"}
STEP_KEYS = {"title", "latex", "note"}

INJECTION_PAYLOADS = [
    "__import__('os').system('true')",
    "().__class__.__bases__[0].__subclasses__()",
    "x.__class__",
    "open('/etc/passwd').read()",
    "exec('1')",
    "x; import os",
    "x\x00",
    "$(whoami)",
]


def test_health_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "online" in response.json()["message"]


def test_successful_response_has_stable_shape(calculate):
    data = calculate(operation="Derivada", expression="x**2")
    assert set(data) == RESPONSE_KEYS
    assert data["success"] is True
    assert data["error"] == ""
    assert all(set(item) == STEP_KEYS for item in data["steps"])


def test_failed_response_has_stable_shape(calculate):
    data = calculate(operation="Derivada", expression="")
    assert set(data) == RESPONSE_KEYS
    assert data["success"] is False
    assert data["result"] == ""
    assert data["steps"] == []
    assert data["error"]


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"operation": "Derivada"},
        {"expression": "x"},
        {"expression": 5, "operation": "Derivada"},
        {"expression": "x", "operation": "Derivada", "order": "abc"},
    ],
)
def test_invalid_payloads_are_rejected_with_422(client, payload):
    assert client.post("/calculate", json=payload).status_code == 422


def test_non_json_body_is_rejected(client):
    response = client.post("/calculate", content="not json", headers={"Content-Type": "application/json"})
    assert response.status_code == 422


@pytest.mark.parametrize("expression", INJECTION_PAYLOADS)
@pytest.mark.parametrize("operation", ["Derivada", "Integral", "Limite", "Raízes", "Reta Tangente"])
def test_calculus_rejects_injection_without_server_error(calculate, operation, expression):
    data = calculate(operation=operation, expression=expression, point="0")
    assert data["success"] is False
    assert "Erro interno" not in data["error"]


@pytest.mark.parametrize("expression", INJECTION_PAYLOADS)
def test_matrix_cells_reject_injection_without_server_error(calculate, expression):
    data = calculate(mode="alglin", operation="Determinante", expression=json.dumps([[expression]]))
    assert data["success"] is False
    assert "Erro interno" not in data["error"]


@pytest.mark.parametrize(
    "operation, field",
    [
        ("Limite", "point"),
        ("Reta Tangente", "point"),
        ("Integral", "lower_bound"),
        ("Integral", "upper_bound"),
    ],
)
def test_secondary_fields_reject_injection(calculate, operation, field):
    payload = {
        "operation": operation,
        "expression": "x",
        "definite_integral": True,
        "lower_bound": "0",
        "upper_bound": "1",
        "point": "0",
    }
    payload[field] = "__import__('os')"
    data = calculate(**payload)
    assert data["success"] is False
    assert "Erro interno" not in data["error"]


def test_allowed_origin_receives_cors_header(client):
    response = client.options(
        "/calculate",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_unknown_origin_does_not_receive_cors_header(client):
    response = client.options(
        "/calculate",
        headers={
            "Origin": "https://evil.example",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert "access-control-allow-origin" not in response.headers


@pytest.mark.parametrize(
    "field, value",
    [
        ("expression", "x" * 20_001),
        ("operation", "x" * 65),
        ("variable", "x" * 65),
        ("point", "1" * 301),
        ("lower_bound", "1" * 301),
        ("upper_bound", "1" * 301),
    ],
)
def test_oversized_fields_are_rejected_before_any_work(client, field, value):
    payload = {"operation": "Derivada", "expression": "x", "mode": "calc1"}
    payload[field] = value

    assert client.post("/calculate", json=payload).status_code == 422