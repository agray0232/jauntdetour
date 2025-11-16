-- ============================================================================
-- JauntDetour Database Schema
-- Database: PostgreSQL 14+
-- PostGIS Extension Required
-- ============================================================================
-- 
-- This schema supports the JauntDetour road trip planning application.
-- It includes tables for users, trips, and detours with full geospatial
-- support via PostGIS.
--
-- Key Features:
-- - UUID primary keys for security and scalability
-- - JSONB columns for flexible API data storage
-- - PostGIS geography types for geospatial queries
-- - Automatic timestamp updates via triggers
-- - Comprehensive indexing strategy
--
-- ============================================================================

-- ============================================================================
-- Extensions
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- For gen_random_uuid()

-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================================
-- Tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Users Table
-- Stores user authentication and profile information
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    -- Primary Key
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Authentication
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Profile Information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    -- Flexible preferences storage (theme, notifications, etc.)
    preferences JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

COMMENT ON TABLE users IS 'Application users with authentication and profile data';
COMMENT ON COLUMN users.preferences IS 'Flexible JSON storage for user preferences (theme, notifications, etc.)';

-- ----------------------------------------------------------------------------
-- Trips Table
-- Stores road trip plans with routes and metadata
-- ----------------------------------------------------------------------------
CREATE TABLE trips (
    -- Primary Key
    trip_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Keys
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Trip Details
    trip_name VARCHAR(255) NOT NULL,
    
    -- Location Data (from Google Maps API)
    origin JSONB NOT NULL,  -- {lat: number, lng: number, address: string}
    destination JSONB NOT NULL,  -- {lat: number, lng: number, address: string}
    
    -- Route Information
    route_polyline TEXT,  -- Google Maps encoded polyline
    route_geometry GEOGRAPHY(LINESTRING, 4326),  -- PostGIS geometry for spatial queries
    distance_meters INTEGER,
    duration_seconds INTEGER,
    
    -- Trip Planning
    departure_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'planned',  -- planned, active, completed, cancelled
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,  -- Extensible field for future features
    
    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
    CONSTRAINT valid_distance CHECK (distance_meters IS NULL OR distance_meters > 0),
    CONSTRAINT valid_duration CHECK (duration_seconds IS NULL OR duration_seconds > 0)
);

COMMENT ON TABLE trips IS 'Road trip plans with routes from Google Maps';
COMMENT ON COLUMN trips.route_polyline IS 'Encoded polyline from Google Maps Directions API';
COMMENT ON COLUMN trips.route_geometry IS 'PostGIS LineString for geospatial queries';
COMMENT ON COLUMN trips.metadata IS 'Extensible JSON field for future features (weather, traffic, etc.)';

-- ----------------------------------------------------------------------------
-- Detours Table
-- Stores points of interest (POI) along trip routes
-- ----------------------------------------------------------------------------
CREATE TABLE detours (
    -- Primary Key
    detour_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Keys
    trip_id UUID NOT NULL REFERENCES trips(trip_id) ON DELETE CASCADE,
    
    -- Place Information (from Google Places API)
    place_id VARCHAR(255),  -- Google Places ID for reference
    place_name VARCHAR(255) NOT NULL,
    place_type VARCHAR(100),  -- restaurant, park, attraction, gas_station, etc.
    
    -- Location Data
    location GEOGRAPHY(POINT, 4326) NOT NULL,  -- PostGIS point for geospatial queries
    location_json JSONB NOT NULL,  -- {lat: number, lng: number, address: string}
    
    -- Route Position
    position_on_route FLOAT,  -- Normalized 0.0-1.0 position along the route
    estimated_detour_duration_seconds INTEGER,
    estimated_detour_distance_meters INTEGER,
    
    -- Place Details
    rating DECIMAL(2,1),  -- Google Places rating (0.0-5.0)
    price_level INTEGER,  -- 1-4 scale from Google Places
    
    -- Visit Planning
    stop_duration_minutes INTEGER DEFAULT 30,
    visit_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    CONSTRAINT valid_position CHECK (position_on_route IS NULL OR (position_on_route >= 0.0 AND position_on_route <= 1.0)),
    CONSTRAINT valid_rating CHECK (rating IS NULL OR (rating >= 0.0 AND rating <= 5.0)),
    CONSTRAINT valid_price_level CHECK (price_level IS NULL OR (price_level >= 1 AND price_level <= 4)),
    CONSTRAINT valid_stop_duration CHECK (stop_duration_minutes IS NULL OR stop_duration_minutes > 0)
);

COMMENT ON TABLE detours IS 'Points of interest (POI) along trip routes';
COMMENT ON COLUMN detours.place_id IS 'Google Places ID for retrieving updated information';
COMMENT ON COLUMN detours.location IS 'PostGIS point for radius searches and proximity queries';
COMMENT ON COLUMN detours.position_on_route IS 'Normalized position along route (0.0=start, 1.0=end)';

-- ============================================================================
-- Indexes
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Users Table Indexes
-- ----------------------------------------------------------------------------

-- B-tree indexes for lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Partial index for active users (login queries)
CREATE INDEX idx_active_users_email ON users(email) WHERE is_active = true;

-- GIN index for JSONB preferences queries
CREATE INDEX idx_users_preferences ON users USING GIN(preferences);

-- ----------------------------------------------------------------------------
-- Trips Table Indexes
-- ----------------------------------------------------------------------------

-- B-tree indexes for common queries
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_created_at ON trips(created_at DESC);
CREATE INDEX idx_trips_departure_time ON trips(departure_time);

-- Composite index for user's active trips
CREATE INDEX idx_trips_user_status ON trips(user_id, status);

-- Partial index for non-cancelled trips
CREATE INDEX idx_active_trips ON trips(user_id, created_at DESC) 
WHERE status IN ('planned', 'active', 'completed');

-- GiST index for geospatial queries on routes
CREATE INDEX idx_trips_route_geometry ON trips USING GIST(route_geometry)
WHERE route_geometry IS NOT NULL;

-- GIN index for metadata JSON queries
CREATE INDEX idx_trips_metadata ON trips USING GIN(metadata);

-- ----------------------------------------------------------------------------
-- Detours Table Indexes
-- ----------------------------------------------------------------------------

-- B-tree indexes for common queries
CREATE INDEX idx_detours_trip_id ON detours(trip_id);
CREATE INDEX idx_detours_place_id ON detours(place_id);
CREATE INDEX idx_detours_place_type ON detours(place_type);
CREATE INDEX idx_detours_created_at ON detours(created_at DESC);

-- Composite index for trip detours ordered by position
CREATE INDEX idx_detours_trip_position ON detours(trip_id, position_on_route);

-- GiST index for geospatial queries (radius searches)
CREATE INDEX idx_detours_location ON detours USING GIST(location);

-- Composite GiST + B-tree for filtered geospatial queries
CREATE INDEX idx_detours_location_type ON detours USING GIST(location) INCLUDE (place_type);

-- GIN index for metadata JSON queries
CREATE INDEX idx_detours_metadata ON detours USING GIN(metadata);

-- ============================================================================
-- Functions and Triggers
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Automatic Timestamp Update Function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates updated_at timestamp on row modification';

-- ----------------------------------------------------------------------------
-- Triggers for Automatic Timestamp Updates
-- ----------------------------------------------------------------------------
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at 
    BEFORE UPDATE ON trips
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_detours_updated_at 
    BEFORE UPDATE ON detours
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Utility Functions
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: Calculate distance between two points
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_distance_meters(
    lat1 DOUBLE PRECISION,
    lng1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION,
    lng2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
BEGIN
    RETURN ST_Distance(
        ST_SetSRID(ST_MakePoint(lng1, lat1), 4326)::geography,
        ST_SetSRID(ST_MakePoint(lng2, lat2), 4326)::geography
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_distance_meters IS 'Calculate distance in meters between two lat/lng points';

-- ----------------------------------------------------------------------------
-- Function: Get detours within radius of a point
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_detours_within_radius(
    center_lat DOUBLE PRECISION,
    center_lng DOUBLE PRECISION,
    radius_meters INTEGER,
    detour_type VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    detour_id UUID,
    place_name VARCHAR,
    place_type VARCHAR,
    distance_meters DOUBLE PRECISION,
    rating DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.detour_id,
        d.place_name,
        d.place_type,
        ST_Distance(
            d.location,
            ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography
        ) as distance_meters,
        d.rating
    FROM detours d
    WHERE ST_DWithin(
        d.location,
        ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
        radius_meters
    )
    AND (detour_type IS NULL OR d.place_type = detour_type)
    ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_detours_within_radius IS 'Find detours within a specified radius of a point';

-- ============================================================================
-- Sample Data (for testing)
-- ============================================================================

-- Insert sample user
INSERT INTO users (email, username, password_hash, first_name, last_name, preferences)
VALUES (
    'demo@jauntdetour.com',
    'demouser',
    '$2a$10$abcdefghijklmnopqrstuvwxyz123456',  -- Placeholder, use bcrypt in production
    'Demo',
    'User',
    '{"theme": "light", "notifications": true}'::jsonb
);

-- Insert sample trip
INSERT INTO trips (
    user_id,
    trip_name,
    origin,
    destination,
    route_geometry,
    distance_meters,
    duration_seconds,
    departure_time,
    status
)
SELECT
    user_id,
    'San Francisco to Yosemite',
    '{"lat": 37.7749, "lng": -122.4194, "address": "San Francisco, CA"}'::jsonb,
    '{"lat": 37.8651, "lng": -119.5383, "address": "Yosemite National Park, CA"}'::jsonb,
    ST_GeogFromText('LINESTRING(-122.4194 37.7749, -121.8863 37.3382, -120.5542 37.3002, -119.5383 37.8651)'),
    280000,  -- 280 km
    12600,   -- 3.5 hours
    CURRENT_TIMESTAMP + INTERVAL '7 days',
    'planned'
FROM users
WHERE email = 'demo@jauntdetour.com';

-- Insert sample detour
INSERT INTO detours (
    trip_id,
    place_id,
    place_name,
    place_type,
    location,
    location_json,
    position_on_route,
    rating,
    price_level,
    stop_duration_minutes,
    notes
)
SELECT
    trip_id,
    'ChIJabcdefg123456789',  -- Placeholder Google Place ID
    'Yosemite Falls Trailhead',
    'park',
    ST_SetSRID(ST_MakePoint(-119.5967, 37.7455), 4326)::geography,
    '{"lat": 37.7455, "lng": -119.5967, "address": "Yosemite Falls Trail, Yosemite Valley, CA"}'::jsonb,
    0.85,  -- Near the end of the trip
    4.8,
    NULL,  -- No price level for parks
    120,  -- 2-hour hike
    'Popular waterfall hike - bring water and sunscreen!'
FROM trips
WHERE trip_name = 'San Francisco to Yosemite';

-- ============================================================================
-- Database Statistics and Verification
-- ============================================================================

-- View table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- View index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Verify PostGIS is working
SELECT PostGIS_Version();

-- ============================================================================
-- Maintenance Commands
-- ============================================================================

-- Analyze tables to update statistics (run after bulk inserts)
-- ANALYZE users;
-- ANALYZE trips;
-- ANALYZE detours;

-- Vacuum tables to reclaim space (run periodically)
-- VACUUM ANALYZE users;
-- VACUUM ANALYZE trips;
-- VACUUM ANALYZE detours;

-- Reindex tables if needed (after heavy updates/deletes)
-- REINDEX TABLE users;
-- REINDEX TABLE trips;
-- REINDEX TABLE detours;

-- ============================================================================
-- Security Recommendations
-- ============================================================================

-- Create read-only user for analytics
-- CREATE USER jauntdetour_readonly WITH PASSWORD 'secure_password_here';
-- GRANT CONNECT ON DATABASE jauntdetour TO jauntdetour_readonly;
-- GRANT USAGE ON SCHEMA public TO jauntdetour_readonly;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO jauntdetour_readonly;

-- Create application user with limited permissions
-- CREATE USER jauntdetour_app WITH PASSWORD 'secure_password_here';
-- GRANT CONNECT ON DATABASE jauntdetour TO jauntdetour_app;
-- GRANT USAGE ON SCHEMA public TO jauntdetour_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO jauntdetour_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO jauntdetour_app;

-- ============================================================================
-- End of Schema
-- ============================================================================
