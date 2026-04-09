from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sympy import symbols, sympify, diff, integrate, limit
from sympy import SympifyError

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CalcRequest(BaseModel):
    expression: str
    operation: str
    variable: str = "x"
    point: str | None = None
    direction: str = "+"
    order: int = 1
    definite_integral: bool = False
    lower_bound: str | None = None
    upper_bound: str | None = None

@app.get("/")
def root():
    return {"status": "ok"}

@app.post("/calculate")
def calculate(data: CalcRequest):
    try:
        expr = sympify(data.expression)

        if data.operation == "Derivada":
            var = symbols(data.variable)
            result = diff(expr, (var, data.order))
            return {
                "success": True,
                "type": "derivative",
                "input": data.expression,
                "variable": data.variable,
                "order": data.order,
                "result": str(result),
            }

        if data.operation == "Integral":
            var = symbols(data.variable)

            if data.definite_integral:
                if data.lower_bound is None or data.upper_bound is None:
                    return {
                        "success": False,
                        "error": "Integral definida exige limite inferior e superior."
                    }

                lower = sympify(data.lower_bound)
                upper = sympify(data.upper_bound)

                result = integrate(expr, (var, lower, upper))
                return {
                    "success": True,
                    "type": "definite-integral",
                    "input": data.expression,
                    "variable": data.variable,
                    "lower_bound": str(lower),
                    "upper_bound": str(upper),
                    "result": str(result),
                }

            result = integrate(expr, var)
            return {
                "success": True,
                "type": "indefinite-integral",
                "input": data.expression,
                "variable": data.variable,
                "result": str(result),
            }

        if data.operation == "Limite":
            var = symbols(data.variable)
            point_value = "0" if data.point is None or data.point == "" else data.point
            point_expr = sympify(point_value)

            result = limit(expr, var, point_expr, dir=data.direction)
            return {
                "success": True,
                "type": "limit",
                "input": data.expression,
                "variable": data.variable,
                "point": str(point_expr),
                "direction": data.direction,
                "result": str(result),
            }

        if data.operation == "Derivadas Parciais":
            var = symbols(data.variable)
            result = diff(expr, var)
            return {
                "success": True,
                "type": "partial-derivative",
                "input": data.expression,
                "variable": data.variable,
                "result": str(result),
            }

        return {
            "success": False,
            "error": f"Operação ainda não suportada: {data.operation}"
        }

    except SympifyError:
        return {
            "success": False,
            "error": "Não foi possível interpretar a expressão matemática."
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }