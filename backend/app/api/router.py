"""Aggregate all v1 routers under /api/v1 (+ compatibility /api/health)."""
from fastapi import APIRouter

from .v1 import health, auth, vehicles, trips, routes, documents, incidents, analytics, billing, sharing

api_router = APIRouter(prefix="/api")

# platform + versioned health
api_router.include_router(health.router)          # /api/health

v1 = APIRouter(prefix="/v1")
v1.include_router(health.router)                  # /api/v1/health
v1.include_router(auth.router)
v1.include_router(vehicles.router)
v1.include_router(trips.router)
v1.include_router(routes.router)
v1.include_router(documents.router)
v1.include_router(incidents.router)
v1.include_router(analytics.router)
v1.include_router(billing.router)
v1.include_router(sharing.router)

api_router.include_router(v1)
