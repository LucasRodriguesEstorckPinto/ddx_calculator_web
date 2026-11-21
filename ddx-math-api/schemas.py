from typing import Optional

from pydantic import BaseModel, Field

MAX_EXPRESSION_LENGTH = 20_000
MAX_VALUE_LENGTH = 300
MAX_NAME_LENGTH = 64


class CalculateRequest(BaseModel):
    mode: Optional[str] = Field("calc1", max_length=MAX_NAME_LENGTH)
    expression: str = Field(max_length=MAX_EXPRESSION_LENGTH)
    operation: str = Field(max_length=MAX_NAME_LENGTH)
    variable: Optional[str] = Field("x", max_length=MAX_NAME_LENGTH)
    point: Optional[str] = Field(None, max_length=MAX_VALUE_LENGTH)
    direction: Optional[str] = Field("+", max_length=MAX_NAME_LENGTH)
    order: Optional[int] = 1
    definite_integral: Optional[bool] = False
    lower_bound: Optional[str] = Field(None, max_length=MAX_VALUE_LENGTH)
    upper_bound: Optional[str] = Field(None, max_length=MAX_VALUE_LENGTH)