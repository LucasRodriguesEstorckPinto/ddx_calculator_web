import sys
import threading
import time

import pytest

import fake_targets
from executor import (
    CalculationExecutor,
    CalculationTimeout,
    ExecutorSettings,
    ServerBusy,
    WorkerCrashed,
)
from solver import run_calculation

DERIVATIVE = {"mode": "calc1", "operation": "Derivada", "expression": "x**2"}


pytestmark = pytest.mark.slow


def settings(**overrides):
    values = {
        "workers": 1,
        "timeout_seconds": 1.0,
        "queue_size": 0,
        "memory_limit_mb": 1024,
        "tasks_per_worker": 100,
    }
    return ExecutorSettings(**{**values, **overrides})


@pytest.fixture
def make_executor():
    created = []

    def factory(target=fake_targets.echo, **overrides):
        executor = CalculationExecutor(settings(**overrides), target=target)
        created.append(executor)
        return executor

    yield factory
    for executor in created:
        executor.close()


def run_in_thread(executor, payload):
    outcome = {}

    def work():
        try:
            outcome["result"] = executor.run(payload)
        except Exception as exc:
            outcome["error"] = exc

    thread = threading.Thread(target=work)
    thread.start()
    return thread, outcome


def test_runs_the_real_calculation_in_a_worker(make_executor):
    executor = make_executor(target=run_calculation, timeout_seconds=15.0)

    result = executor.run(DERIVATIVE)

    assert result["success"] is True
    assert result["result"] == "2*x"


def test_returns_what_the_target_returns(make_executor):
    executor = make_executor()

    assert executor.run({"a": 1}) == {"a": 1}


def test_cuts_off_a_runaway_task_at_the_timeout(make_executor):
    executor = make_executor(target=fake_targets.sleep_forever)

    started = time.monotonic()
    with pytest.raises(CalculationTimeout):
        executor.run({})

    assert time.monotonic() - started < 3.0


def test_replaces_the_worker_after_a_timeout(make_executor):
    executor = make_executor(target=fake_targets.sleep_briefly)

    with pytest.raises(CalculationTimeout):
        executor.run({"seconds": 30})

    assert executor.run({"seconds": 0}) == {"slept": 0}


def test_timeouts_do_not_leak_capacity(make_executor):
    executor = make_executor(target=fake_targets.sleep_briefly)

    for _ in range(3):
        with pytest.raises(CalculationTimeout):
            executor.run({"seconds": 30})

    assert executor.run({"seconds": 0}) == {"slept": 0}


def test_rejects_new_work_when_capacity_is_full(make_executor):
    executor = make_executor(target=fake_targets.sleep_briefly, timeout_seconds=5.0)
    thread, outcome = run_in_thread(executor, {"seconds": 1.5})
    time.sleep(0.5)

    with pytest.raises(ServerBusy):
        executor.run({"seconds": 0})

    thread.join()
    assert outcome["result"] == {"slept": 1.5}


def test_queue_absorbs_a_burst_before_rejecting(make_executor):
    executor = make_executor(
        target=fake_targets.sleep_briefly, queue_size=1, timeout_seconds=10.0
    )
    first, first_outcome = run_in_thread(executor, {"seconds": 1})
    second, second_outcome = run_in_thread(executor, {"seconds": 1})
    time.sleep(0.5)

    with pytest.raises(ServerBusy):
        executor.run({"seconds": 0})

    first.join()
    second.join()
    assert first_outcome["result"] == {"slept": 1}
    assert second_outcome["result"] == {"slept": 1}


def test_reports_a_crashed_worker_and_recovers(make_executor):
    executor = make_executor(target=fake_targets.crash)

    with pytest.raises(WorkerCrashed):
        executor.run({})

    follow_up = make_executor(target=fake_targets.echo)
    assert follow_up.run({"ok": True}) == {"ok": True}


def test_recovers_from_a_crash_in_the_same_pool(make_executor):
    executor = make_executor(target=fake_targets.sleep_briefly)

    with pytest.raises(CalculationTimeout):
        executor.run({"seconds": 30})
    assert executor.run({"seconds": 0}) == {"slept": 0}


@pytest.mark.skipif(sys.platform != "linux", reason="RLIMIT_AS só é aplicado no Linux")
def test_memory_limit_stops_a_greedy_task(make_executor):
    executor = make_executor(target=fake_targets.allocate, memory_limit_mb=1024)

    with pytest.raises(MemoryError):
        executor.run({"bytes": 3 * 2**30})

    assert executor.run({"bytes": 1024}) == 1024


def test_settings_have_safe_defaults(monkeypatch):
    for name in (
        "DDX_WORKERS",
        "DDX_CALC_TIMEOUT",
        "DDX_QUEUE_SIZE",
        "DDX_MEMORY_LIMIT_MB",
        "DDX_TASKS_PER_WORKER",
    ):
        monkeypatch.delenv(name, raising=False)

    loaded = ExecutorSettings.from_env()

    assert 1 <= loaded.workers <= 4
    assert loaded.timeout_seconds == 8.0
    assert loaded.queue_size >= 0
    assert loaded.memory_limit_mb >= 256
    assert loaded.tasks_per_worker >= 1


def test_settings_read_the_environment(monkeypatch):
    monkeypatch.setenv("DDX_WORKERS", "3")
    monkeypatch.setenv("DDX_CALC_TIMEOUT", "2.5")
    monkeypatch.setenv("DDX_QUEUE_SIZE", "7")
    monkeypatch.setenv("DDX_MEMORY_LIMIT_MB", "512")
    monkeypatch.setenv("DDX_TASKS_PER_WORKER", "50")

    assert ExecutorSettings.from_env() == ExecutorSettings(
        workers=3,
        timeout_seconds=2.5,
        queue_size=7,
        memory_limit_mb=512,
        tasks_per_worker=50,
    )


@pytest.mark.parametrize(
    "name, value",
    [
        ("DDX_WORKERS", "0"),
        ("DDX_WORKERS", "abc"),
        ("DDX_CALC_TIMEOUT", "0"),
        ("DDX_CALC_TIMEOUT", "-1"),
        ("DDX_QUEUE_SIZE", "-1"),
        ("DDX_MEMORY_LIMIT_MB", "10"),
        ("DDX_TASKS_PER_WORKER", "0"),
    ],
)
def test_invalid_settings_fail_fast(monkeypatch, name, value):
    monkeypatch.setenv(name, value)

    with pytest.raises(ValueError):
        ExecutorSettings.from_env()