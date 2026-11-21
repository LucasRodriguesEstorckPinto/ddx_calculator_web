import multiprocessing
import os
import threading
from concurrent.futures import TimeoutError as FutureTimeout
from dataclasses import dataclass
from typing import Callable

from pebble import ProcessExpired, ProcessPool

from solver import run_calculation

MIN_MEMORY_LIMIT_MB = 64
WARM_UP_PAYLOAD = {"mode": "calc1", "operation": "Derivada", "expression": "x"}


class CalculationTimeout(Exception):
    pass


class ServerBusy(Exception):
    pass


class WorkerCrashed(Exception):
    pass


def _read_env(name: str, default, cast):
    raw = os.environ.get(name)
    if raw is None:
        return default
    try:
        return cast(raw)
    except ValueError as exc:
        raise ValueError(f"{name} inválido: {raw!r}") from exc


@dataclass(frozen=True)
class ExecutorSettings:
    workers: int
    timeout_seconds: float
    queue_size: int
    memory_limit_mb: int
    tasks_per_worker: int

    def __post_init__(self):
        if self.workers < 1:
            raise ValueError("workers deve ser >= 1")
        if self.timeout_seconds <= 0:
            raise ValueError("timeout_seconds deve ser > 0")
        if self.queue_size < 0:
            raise ValueError("queue_size deve ser >= 0")
        if self.memory_limit_mb < MIN_MEMORY_LIMIT_MB:
            raise ValueError(f"memory_limit_mb deve ser >= {MIN_MEMORY_LIMIT_MB}")
        if self.tasks_per_worker < 1:
            raise ValueError("tasks_per_worker deve ser >= 1")

    @classmethod
    def from_env(cls) -> "ExecutorSettings":
        workers = _read_env("DDX_WORKERS", max(1, min(4, os.cpu_count() or 1)), int)
        return cls(
            workers=workers,
            timeout_seconds=_read_env("DDX_CALC_TIMEOUT", 8.0, float),
            queue_size=_read_env("DDX_QUEUE_SIZE", workers * 2, int),
            memory_limit_mb=_read_env("DDX_MEMORY_LIMIT_MB", 1024, int),
            tasks_per_worker=_read_env("DDX_TASKS_PER_WORKER", 200, int),
        )


def _start_method_context():
    methods = multiprocessing.get_all_start_methods()
    context = multiprocessing.get_context("forkserver" if "forkserver" in methods else "spawn")
    if context.get_start_method() == "forkserver":
        context.set_forkserver_preload(["solver"])
    return context


def _prepare_worker(memory_limit_bytes: int) -> None:
    try:
        import resource
    except ImportError:
        return
    resource.setrlimit(resource.RLIMIT_AS, (memory_limit_bytes, memory_limit_bytes))


class CalculationExecutor:
    def __init__(
        self,
        settings: ExecutorSettings,
        target: Callable[[dict], dict] = run_calculation,
    ):
        self.settings = settings
        self._target = target
        self._slots = threading.BoundedSemaphore(settings.workers + settings.queue_size)
        self._pool = ProcessPool(
            max_workers=settings.workers,
            max_tasks=settings.tasks_per_worker,
            initializer=_prepare_worker,
            initargs=(settings.memory_limit_mb * 1024 * 1024,),
            context=_start_method_context(),
        )

    def run(self, payload: dict) -> dict:
        if not self._slots.acquire(blocking=False):
            raise ServerBusy
        try:
            future = self._pool.schedule(
                self._target, args=(payload,), timeout=self.settings.timeout_seconds
            )
            return future.result()
        except FutureTimeout as exc:
            raise CalculationTimeout from exc
        except ProcessExpired as exc:
            raise WorkerCrashed from exc
        finally:
            self._slots.release()

    def warm_up(self) -> None:
        futures = [
            self._pool.schedule(self._target, args=(WARM_UP_PAYLOAD,), timeout=30)
            for _ in range(self.settings.workers)
        ]
        for future in futures:
            future.result()

    def close(self) -> None:
        self._pool.stop()
        self._pool.join()