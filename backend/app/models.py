"""SQLAlchemy ORM models mapping to the Neon schema."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Boolean, Integer, Numeric, Date, DateTime, ForeignKey, LargeBinary,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, DOUBLE_PRECISION

from .database import Base


def _uuid():
    return uuid.uuid4()


def _now():
    return datetime.now(timezone.utc)


class Profile(Base):
    __tablename__ = "profiles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    full_name = Column(String(255))
    company_name = Column(String(255))
    phone = Column(String(50))
    role = Column(String(50), default="operator")
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)


class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), index=True)
    vehicle_number = Column(String(32), nullable=False)
    vehicle_type = Column(String(64))
    capacity = Column(String(64))
    status = Column(String(32), default="active")
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=_now)


class Trip(Base):
    __tablename__ = "trips"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), index=True)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True)
    origin = Column(String(255))
    destination = Column(String(255))
    origin_lat = Column(DOUBLE_PRECISION)
    origin_lng = Column(DOUBLE_PRECISION)
    destination_lat = Column(DOUBLE_PRECISION)
    destination_lng = Column(DOUBLE_PRECISION)
    travel_date = Column(Date)
    goods_description = Column(Text)
    invoice_value = Column(Numeric)
    declared_distance_km = Column(Numeric)
    estimated_distance_km = Column(Numeric)
    status = Column(String(32), default="created")
    risk_score = Column(Numeric)
    risk_level = Column(String(16))
    vehicle_number = Column(String(32))
    vehicle_type = Column(String(64))
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)


class TripRiskFactor(Base):
    __tablename__ = "trip_risk_factors"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), index=True)
    factor_type = Column(String(64))
    severity = Column(String(16))
    score = Column(Numeric)
    title = Column(Text)
    description = Column(Text)
    recommendation = Column(Text)
    created_at = Column(DateTime(timezone=True), default=_now)


class Document(Base):
    __tablename__ = "documents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), index=True)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="SET NULL"), nullable=True, index=True)
    document_type = Column(String(64))
    storage_path = Column(Text)
    file_name = Column(String(255))
    mime_type = Column(String(128))
    status = Column(String(32), default="uploaded")
    extracted_data = Column(JSONB)
    validation_result = Column(JSONB)
    created_at = Column(DateTime(timezone=True), default=_now)


class DocumentFile(Base):
    __tablename__ = "document_files"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    data = Column(LargeBinary)
    created_at = Column(DateTime(timezone=True), default=_now)


class Incident(Base):
    __tablename__ = "incidents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), index=True)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="SET NULL"), nullable=True, index=True)
    latitude = Column(DOUBLE_PRECISION)
    longitude = Column(DOUBLE_PRECISION)
    location_name = Column(String(255))
    incident_type = Column(String(64))
    reason = Column(Text)
    documents_requested = Column(JSONB)
    outcome = Column(String(64))
    notes = Column(Text)
    occurred_at = Column(DateTime(timezone=True))
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=_now)


class RouteRiskData(Base):
    __tablename__ = "route_risk_data"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    origin_region = Column(String(128))
    destination_region = Column(String(128))
    corridor_name = Column(String(255))
    incident_count = Column(Integer, default=0)
    document_check_count = Column(Integer, default=0)
    distance_issue_count = Column(Integer, default=0)
    risk_score = Column(Numeric)
    is_demo = Column(Boolean, default=True)
    period_start = Column(Date)
    period_end = Column(Date)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)


class ComplianceRule(Base):
    __tablename__ = "compliance_rules"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    rule_code = Column(String(64), unique=True)
    title = Column(Text)
    description = Column(Text)
    category = Column(String(64))
    severity = Column(String(16))
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=_now)


class RiskEvaluation(Base):
    __tablename__ = "risk_evaluations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), index=True)
    score = Column(Numeric)
    level = Column(String(16))
    engine_version = Column(String(32))
    factors = Column(JSONB)
    recommendations = Column(JSONB)
    created_at = Column(DateTime(timezone=True), default=_now)
