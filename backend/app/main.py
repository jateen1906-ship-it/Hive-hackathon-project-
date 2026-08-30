"""FastAPI application factory for TruckShield."""
import logging
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

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=settings.CORS_ORIGINS.split(",") if settings.CORS_ORIGINS != "*" else ["*"],
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
