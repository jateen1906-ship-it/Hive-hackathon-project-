"""SQLAlchemy ORM models mapping to the database schema."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Boolean, Integer, Numeric, Date, DateTime, ForeignKey, LargeBinary, Float, JSON, UniqueConstraint
)
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from .database import Base


class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type on Postgres, and CHAR(36) on SQLite.
    Accepts both string and uuid.UUID.
    """
    impl = CHAR(36)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return uuid.UUID(str(value))
        else:
            return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return value
        try:
            return uuid.UUID(str(value))
        except Exception:
            return value


def _uuid():
    return uuid.uuid4()


def _now():
    return datetime.now(timezone.utc)


class Profile(Base):
    __tablename__ = "profiles"
    id = Column(GUID(), primary_key=True, default=_uuid)
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
    id = Column(GUID(), primary_key=True, default=_uuid)
    user_id = Column(GUID(), ForeignKey("profiles.id", ondelete="CASCADE"), index=True)
    vehicle_number = Column(String(32), nullable=False)
    vehicle_type = Column(String(64))
    capacity = Column(String(64))
    status = Column(String(32), default="active")
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=_now)


class Trip(Base):
    __tablename__ = "trips"
    id = Column(GUID(), primary_key=True, default=_uuid)
    user_id = Column(GUID(), ForeignKey("profiles.id", ondelete="CASCADE"), index=True)
    vehicle_id = Column(GUID(), ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True)
    origin = Column(String(255))
    destination = Column(String(255))
    origin_lat = Column(Float)
    origin_lng = Column(Float)
    destination_lat = Column(Float)
    destination_lng = Column(Float)
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
    id = Column(GUID(), primary_key=True, default=_uuid)
    trip_id = Column(GUID(), ForeignKey("trips.id", ondelete="CASCADE"), index=True)
    factor_type = Column(String(64))
    severity = Column(String(16))
    score = Column(Numeric)
    title = Column(Text)
    description = Column(Text)
    recommendation = Column(Text)
    created_at = Column(DateTime(timezone=True), default=_now)


class Document(Base):
    __tablename__ = "documents"
    id = Column(GUID(), primary_key=True, default=_uuid)
    user_id = Column(GUID(), ForeignKey("profiles.id", ondelete="CASCADE"), index=True)
    trip_id = Column(GUID(), ForeignKey("trips.id", ondelete="SET NULL"), nullable=True, index=True)
    document_type = Column(String(64))
    storage_path = Column(Text)
    file_name = Column(String(255))
    mime_type = Column(String(128))
    status = Column(String(32), default="uploaded")
    extracted_data = Column(JSON)
    validation_result = Column(JSON)
    created_at = Column(DateTime(timezone=True), default=_now)


class DocumentFile(Base):
    __tablename__ = "document_files"
    id = Column(GUID(), primary_key=True, default=_uuid)
    document_id = Column(GUID(), ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    data = Column(LargeBinary)
    created_at = Column(DateTime(timezone=True), default=_now)


class Incident(Base):
    __tablename__ = "incidents"
    id = Column(GUID(), primary_key=True, default=_uuid)
    user_id = Column(GUID(), ForeignKey("profiles.id", ondelete="CASCADE"), index=True)
    trip_id = Column(GUID(), ForeignKey("trips.id", ondelete="SET NULL"), nullable=True, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    location_name = Column(String(255))
    incident_type = Column(String(64))
    reason = Column(Text)
    documents_requested = Column(JSON)
    outcome = Column(String(64))
    notes = Column(Text)
    occurred_at = Column(DateTime(timezone=True))
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=_now)


class RouteRiskData(Base):
    __tablename__ = "route_risk_data"
    id = Column(GUID(), primary_key=True, default=_uuid)
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
    id = Column(GUID(), primary_key=True, default=_uuid)
    rule_code = Column(String(64), unique=True)
    title = Column(Text)
    description = Column(Text)
    category = Column(String(64))
    severity = Column(String(16))
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=_now)


class RiskEvaluation(Base):
    __tablename__ = "risk_evaluations"
    id = Column(GUID(), primary_key=True, default=_uuid)
    trip_id = Column(GUID(), ForeignKey("trips.id", ondelete="CASCADE"), index=True)
    score = Column(Numeric)
    level = Column(String(16))
    engine_version = Column(String(32))
    factors = Column(JSON)
    recommendations = Column(JSON)
    created_at = Column(DateTime(timezone=True), default=_now)


class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(GUID(), primary_key=True, default=_uuid)
    user_id = Column(GUID(), ForeignKey("profiles.id", ondelete="CASCADE"), unique=True, index=True)
    plan = Column(String(32), default="free", nullable=False)
    status = Column(String(32), default="active", nullable=False)
    razorpay_subscription_id = Column(String(255))
    razorpay_plan_id = Column(String(255))
    current_period_end = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)


class UsageCounter(Base):
    __tablename__ = "usage_counters"
    id = Column(GUID(), primary_key=True, default=_uuid)
    user_id = Column(GUID(), ForeignKey("profiles.id", ondelete="CASCADE"), index=True)
    period = Column(String(32), nullable=False)
    checks = Column(Integer, default=0, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_now)
    __table_args__ = (UniqueConstraint("user_id", "period", name="uq_user_period"),)


class ShareLink(Base):
    __tablename__ = "share_links"
    id = Column(GUID(), primary_key=True, default=_uuid)
    user_id = Column(GUID(), ForeignKey("profiles.id", ondelete="CASCADE"), index=True)
    trip_id = Column(GUID(), ForeignKey("trips.id", ondelete="CASCADE"), index=True)
    token = Column(String(255), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True))
    revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_now)


class ApiKey(Base):
    __tablename__ = "api_keys"
    id = Column(GUID(), primary_key=True, default=_uuid)
    user_id = Column(GUID(), ForeignKey("profiles.id", ondelete="CASCADE"), index=True)
    key_prefix = Column(String(64), nullable=False)
    key_hash = Column(Text, nullable=False)
    label = Column(String(255))
    revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_now)


class BillingPlan(Base):
    __tablename__ = "billing_plans"
    id = Column(GUID(), primary_key=True, default=_uuid)
    tier = Column(String(64), unique=True, nullable=False)
    razorpay_plan_id = Column(String(255))
    amount = Column(Integer)
    created_at = Column(DateTime(timezone=True), default=_now)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    id = Column(GUID(), primary_key=True, default=_uuid)
    user_id = Column(GUID(), ForeignKey("profiles.id", ondelete="CASCADE"), index=True)
    token_hash = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_now)
