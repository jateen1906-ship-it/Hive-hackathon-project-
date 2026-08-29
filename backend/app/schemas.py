"""Pydantic request/response schemas."""
from typing import Optional, List, Any
from datetime import date
from pydantic import BaseModel, EmailStr, Field


# ---- Auth ----
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    phone: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


# ---- Vehicle ----
class VehicleIn(BaseModel):
    vehicle_number: str
    vehicle_type: Optional[str] = None
    capacity: Optional[str] = None
    status: Optional[str] = "active"


# ---- Trip ----
class TripIn(BaseModel):
    origin: str
    destination: str
    travel_date: Optional[date] = None
    goods_description: Optional[str] = None
    invoice_value: Optional[float] = None
    declared_distance_km: Optional[float] = None
    vehicle_id: Optional[str] = None
    vehicle_number: Optional[str] = None
    vehicle_type: Optional[str] = None


class TripUpdate(BaseModel):
    origin: Optional[str] = None
    destination: Optional[str] = None
    travel_date: Optional[date] = None
    goods_description: Optional[str] = None
    invoice_value: Optional[float] = None
    declared_distance_km: Optional[float] = None
    vehicle_number: Optional[str] = None
    vehicle_type: Optional[str] = None


# ---- Routes ----
class RouteAnalyzeIn(BaseModel):
    origin: str
    destination: str
    declared_distance_km: Optional[float] = None


# ---- Incident ----
class IncidentIn(BaseModel):
    trip_id: Optional[str] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    incident_type: str
    reason: Optional[str] = None
    documents_requested: Optional[List[str]] = None
    outcome: Optional[str] = "unknown"
    notes: Optional[str] = None
    occurred_at: Optional[str] = None
