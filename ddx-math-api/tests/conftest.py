import json

import pytest
from fastapi.testclient import TestClient

from main import app


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="session")
def calculate(client):
    def run(**payload):
        payload.setdefault("mode", "calc1")
        response = client.post("/calculate", json=payload)
        assert response.status_code == 200
        return response.json()

    return run


@pytest.fixture(scope="session")
def linear(calculate):
    def run(operation, rows):
        return calculate(mode="alglin", operation=operation, expression=json.dumps(rows))

    return run