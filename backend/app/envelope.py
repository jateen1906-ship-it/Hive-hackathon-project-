"""Consistent JSON response envelope + domain exceptions."""
from typing import Any, Optional
from fastapi.responses import JSONResponse
from fastapi import status as http_status


def ok(data: Any = None, status_code: int = 200) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"success": True, "data": jsonable(data), "error": None})


def err(code: str, message: str, status_code: int = 400) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "data": None, "error": {"code": code, "message": message}},
    )


class AppError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFound(AppError):
    def __init__(self, message: str = "Resource not found", code: str = "NOT_FOUND"):
        super().__init__(code, message, http_status.HTTP_404_NOT_FOUND)


class Unauthorized(AppError):
    def __init__(self, message: str = "Unauthorized", code: str = "UNAUTHORIZED"):
        super().__init__(code, message, http_status.HTTP_401_UNAUTHORIZED)


class BadRequest(AppError):
    def __init__(self, message: str = "Bad request", code: str = "BAD_REQUEST"):
        super().__init__(code, message, http_status.HTTP_400_BAD_REQUEST)


def jsonable(obj):
    """Recursively convert values to JSON-safe primitives."""
    import datetime as _dt
    import decimal as _dec
    import uuid as _uuid

    if obj is None or isinstance(obj, (str, int, float, bool)):
        return obj
    if isinstance(obj, _dec.Decimal):
        return float(obj)
    if isinstance(obj, (_dt.datetime, _dt.date)):
        return obj.isoformat()
    if isinstance(obj, _uuid.UUID):
        return str(obj)
    if isinstance(obj, dict):
        return {k: jsonable(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [jsonable(v) for v in obj]
    return str(obj)
