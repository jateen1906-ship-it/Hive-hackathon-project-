"""TruckShield backend entrypoint. Supervisor runs `uvicorn server:app`.
The real application lives in the modular `app` package."""
from app.main import app  # noqa: F401
