from typing import Any, Optional


def step(title: str, tex: Optional[str] = None, note: Optional[str] = None) -> dict:
    return {"title": title, "latex": tex or "", "note": note or ""}


def ok(result: str, tex: Optional[str] = None, steps: Optional[list] = None, analysis: Any = None) -> dict:
    return {
        "success": True,
        "result": result,
        "latex": tex or "",
        "steps": steps or [],
        "error": "",
        "analysis": analysis,
    }


def fail(message: str) -> dict:
    return {"success": False, "result": "", "latex": "", "steps": [], "error": message, "analysis": None}