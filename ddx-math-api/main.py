from contextlib import asynccontextmanager
from typing import Optional

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from executor import (
    CalculationExecutor,
    CalculationTimeout,
    ExecutorSettings,
    ServerBusy,
    WorkerCrashed,
)
from responses import fail
from schemas import CalculateRequest

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
RETRY_AFTER_SECONDS = "2"


def get_executor(request: Request) -> CalculationExecutor:
    return request.app.state.executor


def create_app(settings: Optional[ExecutorSettings] = None) -> FastAPI:
    settings = settings or ExecutorSettings.from_env()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        executor = CalculationExecutor(settings)
        executor.warm_up()
        app.state.executor = executor
        try:
            yield
        finally:
            executor.close()

    app = FastAPI(title="DDX Math API", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/")
    def root():
        return {"message": "DDX Math API online"}

    @app.post("/calculate")
    def calculate(
        payload: CalculateRequest,
        executor: CalculationExecutor = Depends(get_executor),
    ):
        try:
            return executor.run(payload.model_dump())
        except CalculationTimeout:
            return fail(
                f"O cálculo excedeu o tempo limite de {settings.timeout_seconds:g} s. "
                "Simplifique a expressão."
            )
        except WorkerCrashed:
            return fail("O cálculo foi interrompido por consumir recursos demais.")
        except ServerBusy:
            return JSONResponse(
                status_code=503,
                content=fail("O servidor está ocupado. Tente novamente em instantes."),
                headers={"Retry-After": RETRY_AFTER_SECONDS},
            )

    return app


app = create_app()