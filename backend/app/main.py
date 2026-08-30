"""FastAPI application factory for TruckShield."""
import logging
import re
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from starlette.middleware.cors import CORSMiddleware

from .config import settings
from .envelope import err, AppError
from .api.router import api_router
from .db.migrate import run_migrations
from .db.seed import ensure_seed

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("truckshield")

app = FastAPI(title="TruckShield API", version="1.0.0")

# Clean and normalize configured CORS origins
raw_origins = [o.strip().rstrip("/") for o in settings.CORS_ORIGINS.split(",") if o.strip()]
cleaned_origins = []
for o in raw_origins:
    if o == "*":
        cleaned_origins.append("*")
    else:
        # Strip any accidental path from origin (e.g. https://domain.vercel.app/pricing -> https://domain.vercel.app)
        match = re.match(r"^(https?://[^/]+)", o)
        if match:
            cleaned_origins.append(match.group(1))
        else:
            cleaned_origins.append(o)

# Default origins for local development and common hosts
default_origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:8001",
    "https://hive-hackathon-project.vercel.app",
]

for d in default_origins:
    if d not in cleaned_origins and "*" not in cleaned_origins:
        cleaned_origins.append(d)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cleaned_origins if "*" not in cleaned_origins else ["*"],
    # Allow any vercel deployment preview URL dynamically
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/")
@app.head("/")
async def root():
    return {
        "status": "ok",
        "service": "TruckShield API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/health"
    }


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return err(exc.code, exc.message, exc.status_code)


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    msg = "; ".join(
        f"{'.'.join(str(x) for x in e['loc'][1:])}: {e['msg']}" for e in exc.errors()
    ) or "Validation error"
    return err("VALIDATION_ERROR", msg, 422)


@app.exception_handler(Exception)
async def unhandled_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s: %s", request.url.path, exc)
    return err("INTERNAL_ERROR", "Something went wrong. Please try again.", 500)


@app.on_event("startup")
async def on_startup():
    try:
        run_migrations()
        logger.info("Migrations applied.")
    except Exception as e:
        logger.exception("Migration failed: %s", e)
    try:
        await ensure_seed()
    except Exception as e:
        logger.exception("Seed failed: %s", e)
    try:
        from .billing.service import ensure_plans
        from .database import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            await ensure_plans(db)
        logger.info("Razorpay plans ensured.")
    except Exception as e:
        logger.exception("Plan bootstrap failed: %s", e)
