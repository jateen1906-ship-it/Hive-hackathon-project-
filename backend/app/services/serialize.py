"""ORM row -> plain JSON-safe dict."""
from sqlalchemy.inspection import inspect as sa_inspect
from ..envelope import jsonable


def to_dict(obj) -> dict:
    if obj is None:
        return None
    data = {}
    for col in sa_inspect(obj).mapper.column_attrs:
        data[col.key] = jsonable(getattr(obj, col.key))
    return data
