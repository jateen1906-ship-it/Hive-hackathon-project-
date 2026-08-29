-- TruckShield initial schema (Neon PostgreSQL). Idempotent.

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    company_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'operator',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    vehicle_number TEXT NOT NULL,
    vehicle_type TEXT,
    capacity TEXT,
    status TEXT DEFAULT 'active',
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vehicles_user ON vehicles(user_id);

CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    origin TEXT,
    destination TEXT,
    origin_lat DOUBLE PRECISION,
    origin_lng DOUBLE PRECISION,
    destination_lat DOUBLE PRECISION,
    destination_lng DOUBLE PRECISION,
    travel_date DATE,
    goods_description TEXT,
    invoice_value NUMERIC,
    declared_distance_km NUMERIC,
    estimated_distance_km NUMERIC,
    status TEXT DEFAULT 'created',
    risk_score NUMERIC,
    risk_level TEXT,
    vehicle_number TEXT,
    vehicle_type TEXT,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trips_user ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_created ON trips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trips_risk_level ON trips(risk_level);

CREATE TABLE IF NOT EXISTS trip_risk_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    factor_type TEXT,
    severity TEXT,
    score NUMERIC,
    title TEXT,
    description TEXT,
    recommendation TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_factors_trip ON trip_risk_factors(trip_id);

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    document_type TEXT,
    storage_path TEXT,
    file_name TEXT,
    mime_type TEXT,
    status TEXT DEFAULT 'uploaded',
    extracted_data JSONB,
    validation_result JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_trip ON documents(trip_id);

CREATE TABLE IF NOT EXISTS document_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    data BYTEA,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_docfiles_doc ON document_files(document_id);

CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location_name TEXT,
    incident_type TEXT,
    reason TEXT,
    documents_requested JSONB,
    outcome TEXT,
    notes TEXT,
    occurred_at TIMESTAMPTZ,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_incidents_user ON incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_trip ON incidents(trip_id);

CREATE TABLE IF NOT EXISTS route_risk_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_region TEXT,
    destination_region TEXT,
    corridor_name TEXT,
    incident_count INTEGER DEFAULT 0,
    document_check_count INTEGER DEFAULT 0,
    distance_issue_count INTEGER DEFAULT 0,
    risk_score NUMERIC,
    is_demo BOOLEAN DEFAULT true,
    period_start DATE,
    period_end DATE,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS compliance_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_code TEXT UNIQUE,
    title TEXT,
    description TEXT,
    category TEXT,
    severity TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS risk_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    score NUMERIC,
    level TEXT,
    engine_version TEXT,
    factors JSONB,
    recommendations JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_eval_trip ON risk_evaluations(trip_id);
