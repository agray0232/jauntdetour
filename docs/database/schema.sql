-- ============================================================================
-- JauntDetour Database Schema
-- Database: Azure Database for PostgreSQL (Flexible Server), PostgreSQL 14+
-- No PostGIS / spatial extensions: Google Maps APIs handle all geospatial work.
-- Authentication: Microsoft Entra External ID (credentials are NOT stored here).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- Users
-- Profile only. Authentication is delegated to Microsoft Entra External ID;
-- we store the provider's stable subject ("sub") claim as external_id.
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    user_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id  VARCHAR(255) UNIQUE NOT NULL,        -- Entra "sub" claim
    email        VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(150),
    created_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_login   TIMESTAMPTZ,
    is_active    BOOLEAN DEFAULT true,
    preferences  JSONB DEFAULT '{}'::jsonb,           -- theme, notifications, etc.
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ----------------------------------------------------------------------------
-- Trips
-- Saved road trips. Google API responses stored as JSONB.
-- ----------------------------------------------------------------------------
CREATE TABLE trips (
    trip_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    trip_name        VARCHAR(255) NOT NULL,
    origin           JSONB NOT NULL,                  -- {lat, lng, address}
    destination      JSONB NOT NULL,                  -- {lat, lng, address}
    route_polyline   TEXT,                            -- Google encoded polyline
    distance_meters  INTEGER,                         -- cached from Directions API
    duration_seconds INTEGER,                         -- cached from Directions API
    departure_time   TIMESTAMPTZ,
    status           VARCHAR(50) DEFAULT 'planned',
    created_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    metadata         JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT valid_status   CHECK (status IN ('planned','active','completed','cancelled')),
    CONSTRAINT valid_distance CHECK (distance_meters IS NULL OR distance_meters > 0),
    CONSTRAINT valid_duration CHECK (duration_seconds IS NULL OR duration_seconds > 0)
);

-- ----------------------------------------------------------------------------
-- Detours
-- Points of interest saved along a trip. Plain lat/lng (no spatial index):
-- proximity search is performed by Google Places, not the database.
-- ----------------------------------------------------------------------------
CREATE TABLE detours (
    detour_id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id                           UUID NOT NULL REFERENCES trips(trip_id) ON DELETE CASCADE,
    place_id                          VARCHAR(255),     -- Google Places ID
    place_name                        VARCHAR(255) NOT NULL,
    place_type                        VARCHAR(100),     -- restaurant, park, etc.
    latitude                          DECIMAL(10, 8) NOT NULL,
    longitude                         DECIMAL(11, 8) NOT NULL,
    address                           VARCHAR(500),
    position_on_route                 FLOAT,            -- normalized 0.0-1.0
    estimated_detour_duration_seconds INTEGER,
    estimated_detour_distance_meters  INTEGER,
    rating                            DECIMAL(2,1),     -- Google rating 0.0-5.0
    price_level                       INTEGER,          -- 1-4
    stop_duration_minutes             INTEGER DEFAULT 30,
    visit_time                        TIMESTAMPTZ,
    notes                             TEXT,
    created_at                        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at                        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    metadata                          JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT valid_latitude    CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT valid_longitude   CHECK (longitude BETWEEN -180 AND 180),
    CONSTRAINT valid_position    CHECK (position_on_route IS NULL OR (position_on_route >= 0.0 AND position_on_route <= 1.0)),
    CONSTRAINT valid_rating      CHECK (rating IS NULL OR (rating >= 0.0 AND rating <= 5.0)),
    CONSTRAINT valid_price_level CHECK (price_level IS NULL OR (price_level BETWEEN 1 AND 4))
);

-- ----------------------------------------------------------------------------
-- Indexes (B-tree only; no spatial/GiST indexes needed)
-- ----------------------------------------------------------------------------
CREATE INDEX idx_users_external_id  ON users(external_id);
CREATE INDEX idx_trips_user_id      ON trips(user_id);
CREATE INDEX idx_trips_status       ON trips(status);
CREATE INDEX idx_trips_created_at   ON trips(created_at DESC);
CREATE INDEX idx_trips_user_status  ON trips(user_id, status) INCLUDE (trip_name, created_at);
CREATE INDEX idx_detours_trip_id    ON detours(trip_id);
CREATE INDEX idx_detours_place_type ON detours(place_type);

-- ----------------------------------------------------------------------------
-- Auto-update updated_at
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at   BEFORE UPDATE ON users   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trips_updated_at   BEFORE UPDATE ON trips   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_detours_updated_at BEFORE UPDATE ON detours FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Sample data (testing)
-- ----------------------------------------------------------------------------
INSERT INTO users (external_id, email, display_name, preferences)
VALUES ('entra-sub-demo-0001', 'demo@jauntdetour.com', 'Demo User',
        '{"theme": "light", "notifications": true}'::jsonb);

INSERT INTO trips (user_id, trip_name, origin, destination, route_polyline, distance_meters, duration_seconds, status)
SELECT user_id,
       'San Francisco to Yosemite',
       '{"lat": 37.7749, "lng": -122.4194, "address": "San Francisco, CA"}'::jsonb,
       '{"lat": 37.8651, "lng": -119.5383, "address": "Yosemite National Park, CA"}'::jsonb,
       'encoded_polyline_placeholder', 280000, 12600, 'planned'
FROM users WHERE email = 'demo@jauntdetour.com';

INSERT INTO detours (trip_id, place_id, place_name, place_type, latitude, longitude, address, position_on_route, rating, stop_duration_minutes, notes)
SELECT trip_id, 'ChIJabcdefg123456789', 'Yosemite Falls Trailhead', 'park',
       37.74550000, -119.59670000, 'Yosemite Valley, CA', 0.85, 4.8, 120,
       'Popular waterfall hike - bring water and sunscreen!'
FROM trips WHERE trip_name = 'San Francisco to Yosemite';

-- ----------------------------------------------------------------------------
-- Application user (least privilege) — set a real secret from Key Vault
-- ----------------------------------------------------------------------------
-- CREATE USER jauntdetour_app WITH PASSWORD '<from Key Vault>';
-- GRANT CONNECT ON DATABASE jauntdetour TO jauntdetour_app;
-- GRANT USAGE ON SCHEMA public TO jauntdetour_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO jauntdetour_app;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public
--   GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO jauntdetour_app;

-- ============================================================================
-- End of Schema
-- ============================================================================
