# Azure PostgreSQL Implementation Guide for JauntDetour

**Target Database:** Azure Database for PostgreSQL Flexible Server  
**Purpose:** Step-by-step guide for implementing the recommended database solution  
**Audience:** Development team

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Database Configuration](#database-configuration)
4. [Application Integration](#application-integration)
5. [Testing & Validation](#testing--validation)
6. [Production Deployment](#production-deployment)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools
- **Azure CLI** (version 2.30+)
- **psql client** (PostgreSQL 14+)
- **Node.js** (v16+ for backend application)
- **Git** (for schema version control)

### Install Azure CLI
```bash
# macOS
brew install azure-cli

# Ubuntu/Debian
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Windows
# Download from https://aka.ms/installazurecliwindows
```

### Install PostgreSQL Client
```bash
# macOS
brew install postgresql@14

# Ubuntu/Debian
sudo apt-get install postgresql-client-14

# Windows
# Download from https://www.postgresql.org/download/windows/
```

### Azure Subscription
- Active Azure subscription
- Contributor or Owner role
- Resource group creation permissions

---

## Infrastructure Setup

### Step 1: Login to Azure
```bash
# Login to Azure
az login

# Set default subscription (if multiple)
az account set --subscription "Your Subscription Name"

# Verify current subscription
az account show --output table
```

### Step 2: Create Resource Group
```bash
# Create resource group in East US region
az group create \
  --name jauntdetour-rg \
  --location eastus

# Verify creation
az group show --name jauntdetour-rg --output table
```

### Step 3: Create PostgreSQL Server (Development - Free Tier)

```bash
# Create PostgreSQL Flexible Server with free tier
az postgres flexible-server create \
  --resource-group jauntdetour-rg \
  --name jauntdetour-db-dev \
  --location eastus \
  --admin-user dbadmin \
  --admin-password 'YourSecurePassword123!' \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 14 \
  --public-access 0.0.0.0 \
  --backup-retention 7 \
  --high-availability Disabled \
  --tags Environment=Development Project=JauntDetour

# Note: Save the connection details from output!
```

**Parameters Explained:**
- `--sku-name Standard_B1ms` → Free tier eligible (1 vCore, 2 GiB RAM)
- `--storage-size 32` → 32 GB storage (free tier limit)
- `--backup-retention 7` → 7 days of backups (minimum)
- `--public-access 0.0.0.0` → Allow all IPs (dev only, restrict in production)
- `--high-availability Disabled` → No HA in development (saves cost)

### Step 4: Create PostgreSQL Server (Production)

```bash
# Create PostgreSQL Flexible Server for production
az postgres flexible-server create \
  --resource-group jauntdetour-rg \
  --name jauntdetour-db-prod \
  --location eastus \
  --admin-user dbadmin \
  --admin-password 'YourSecureProductionPassword456!' \
  --sku-name Standard_D2s_v3 \
  --tier GeneralPurpose \
  --storage-size 128 \
  --version 14 \
  --public-access None \
  --backup-retention 14 \
  --geo-redundant-backup Enabled \
  --high-availability ZoneRedundant \
  --tags Environment=Production Project=JauntDetour

# Note: This will take 5-10 minutes to provision
```

**Production Parameters:**
- `--sku-name Standard_D2s_v3` → Production tier (2 vCores, 8 GiB RAM)
- `--storage-size 128` → 128 GB storage (expandable to 16 TB)
- `--public-access None` → No public access (use VNet integration)
- `--backup-retention 14` → 14 days backup retention
- `--geo-redundant-backup Enabled` → Disaster recovery ready
- `--high-availability ZoneRedundant` → Auto-failover across availability zones

### Step 5: Configure Firewall Rules

**Development (Allow specific IPs):**
```bash
# Allow your current IP
MY_IP=$(curl -s https://api.ipify.org)
az postgres flexible-server firewall-rule create \
  --resource-group jauntdetour-rg \
  --name jauntdetour-db-dev \
  --rule-name AllowMyIP \
  --start-ip-address $MY_IP \
  --end-ip-address $MY_IP

# Allow Azure services (for App Service, Functions, etc.)
az postgres flexible-server firewall-rule create \
  --resource-group jauntdetour-rg \
  --name jauntdetour-db-dev \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

**Production (VNet Integration - Recommended):**
```bash
# Create VNet
az network vnet create \
  --resource-group jauntdetour-rg \
  --name jauntdetour-vnet \
  --address-prefix 10.0.0.0/16 \
  --subnet-name db-subnet \
  --subnet-prefix 10.0.1.0/24

# Delegate subnet to PostgreSQL
az network vnet subnet update \
  --resource-group jauntdetour-rg \
  --vnet-name jauntdetour-vnet \
  --name db-subnet \
  --delegations Microsoft.DBforPostgreSQL/flexibleServers
```

---

## Database Configuration

### Step 1: Enable PostGIS Extension

```bash
# Connect to database
psql "host=jauntdetour-db-dev.postgres.database.azure.com \
      port=5432 \
      dbname=postgres \
      user=dbadmin \
      sslmode=require"

# Enable extensions (in psql)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

# Verify extensions
SELECT name, default_version, installed_version
FROM pg_available_extensions
WHERE name IN ('uuid-ossp', 'pgcrypto', 'postgis');
```

### Step 2: Create Application Database

```bash
# Create database
CREATE DATABASE jauntdetour
  WITH OWNER = dbadmin
       ENCODING = 'UTF8'
       LC_COLLATE = 'en_US.utf8'
       LC_CTYPE = 'en_US.utf8';

# Connect to new database
\c jauntdetour

# Verify connection
SELECT current_database(), current_user;
```

### Step 3: Apply Schema

```bash
# Exit psql
\q

# Apply schema from file
psql "host=jauntdetour-db-dev.postgres.database.azure.com \
      port=5432 \
      dbname=jauntdetour \
      user=dbadmin \
      sslmode=require" \
  < docs/database-schema.sql

# Verify tables created
psql "host=jauntdetour-db-dev.postgres.database.azure.com \
      port=5432 \
      dbname=jauntdetour \
      user=dbadmin \
      sslmode=require" \
  -c "\dt"
```

### Step 4: Create Application User (Security Best Practice)

```sql
-- Create read-write user for application
CREATE USER jauntdetour_app WITH PASSWORD 'AppSecurePassword789!';

-- Grant necessary permissions
GRANT CONNECT ON DATABASE jauntdetour TO jauntdetour_app;
GRANT USAGE ON SCHEMA public TO jauntdetour_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO jauntdetour_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO jauntdetour_app;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO jauntdetour_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO jauntdetour_app;
```

### Step 5: Configure Server Parameters

```bash
# Adjust configuration for performance
az postgres flexible-server parameter set \
  --resource-group jauntdetour-rg \
  --server-name jauntdetour-db-dev \
  --name max_connections \
  --value 100

az postgres flexible-server parameter set \
  --resource-group jauntdetour-rg \
  --server-name jauntdetour-db-dev \
  --name shared_buffers \
  --value 256MB

az postgres flexible-server parameter set \
  --resource-group jauntdetour-rg \
  --server-name jauntdetour-db-dev \
  --name work_mem \
  --value 8MB

# Enable query statistics
az postgres flexible-server parameter set \
  --resource-group jauntdetour-rg \
  --server-name jauntdetour-db-dev \
  --name pg_stat_statements.track \
  --value all
```

---

## Application Integration

### Step 1: Install PostgreSQL Driver

```bash
# Navigate to backend directory
cd backend

# Install pg (PostgreSQL client for Node.js)
npm install pg

# Install additional libraries
npm install pg-pool  # Connection pooling
npm install dotenv   # Environment variables (if not already installed)
```

### Step 2: Create Database Module

**File: `backend/config/database.js`**
```javascript
const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: true,
    // For Azure PostgreSQL, you might need to download the SSL certificate
    // ca: fs.readFileSync('/path/to/BaltimoreCyberTrustRoot.crt.pem').toString()
  },
  
  // Connection pool settings
  max: 20,                    // Maximum number of connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if can't connect
};

// Create connection pool
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
});

// Export pool for use in application
module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};
```

### Step 3: Environment Variables

**File: `backend/.env.example`**
```bash
# Database Configuration
DB_HOST=jauntdetour-db-dev.postgres.database.azure.com
DB_PORT=5432
DB_NAME=jauntdetour
DB_USER=jauntdetour_app
DB_PASSWORD=AppSecurePassword789!

# Google API (existing)
GOOGLE_API_KEY=your_google_api_key_here

# Node Environment
NODE_ENV=development
```

**File: `backend/.env`** (create from example, don't commit)
```bash
# Copy .env.example to .env and fill in actual values
cp .env.example .env

# Edit with actual credentials
nano .env
```

**Update: `backend/.gitignore`**
```
# Environment variables
.env
.env.local
.env.*.local
```

### Step 4: Create Data Access Layer

**File: `backend/app/models/User.js`**
```javascript
const db = require('../../config/database');

class User {
  /**
   * Create a new user
   */
  static async create({ email, username, passwordHash, firstName, lastName, preferences = {} }) {
    const query = `
      INSERT INTO users (email, username, password_hash, first_name, last_name, preferences)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING user_id, email, username, first_name, last_name, created_at
    `;
    const values = [email, username, passwordHash, firstName, lastName, JSON.stringify(preferences)];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Email or username already exists');
      }
      throw error;
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1 AND is_active = true';
    const result = await db.query(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   */
  static async findById(userId) {
    const query = 'SELECT * FROM users WHERE user_id = $1 AND is_active = true';
    const result = await db.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Update last login timestamp
   */
  static async updateLastLogin(userId) {
    const query = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1';
    await db.query(query, [userId]);
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(userId, preferences) {
    const query = 'UPDATE users SET preferences = $1 WHERE user_id = $2 RETURNING preferences';
    const result = await db.query(query, [JSON.stringify(preferences), userId]);
    return result.rows[0];
  }
}

module.exports = User;
```

**File: `backend/app/models/Trip.js`**
```javascript
const db = require('../../config/database');

class Trip {
  /**
   * Create a new trip
   */
  static async create({ userId, tripName, origin, destination, routePolyline, distanceMeters, durationSeconds, departureTime }) {
    const query = `
      INSERT INTO trips (user_id, trip_name, origin, destination, route_polyline, distance_meters, duration_seconds, departure_time)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING trip_id, trip_name, origin, destination, distance_meters, duration_seconds, departure_time, status, created_at
    `;
    const values = [
      userId,
      tripName,
      JSON.stringify(origin),
      JSON.stringify(destination),
      routePolyline,
      distanceMeters,
      durationSeconds,
      departureTime
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Get all trips for a user
   */
  static async findByUserId(userId, status = null) {
    let query = `
      SELECT trip_id, trip_name, origin, destination, distance_meters, duration_seconds, 
             departure_time, status, created_at, updated_at
      FROM trips
      WHERE user_id = $1
    `;
    const values = [userId];
    
    if (status) {
      query += ' AND status = $2';
      values.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await db.query(query, values);
    return result.rows;
  }

  /**
   * Get trip with all detours
   */
  static async findByIdWithDetours(tripId) {
    const query = `
      SELECT 
        t.*,
        COALESCE(
          json_agg(
            json_build_object(
              'detour_id', d.detour_id,
              'place_name', d.place_name,
              'place_type', d.place_type,
              'location', d.location_json,
              'rating', d.rating,
              'position_on_route', d.position_on_route,
              'stop_duration_minutes', d.stop_duration_minutes,
              'notes', d.notes
            ) ORDER BY d.position_on_route
          ) FILTER (WHERE d.detour_id IS NOT NULL),
          '[]'
        ) as detours
      FROM trips t
      LEFT JOIN detours d ON t.trip_id = d.trip_id
      WHERE t.trip_id = $1
      GROUP BY t.trip_id
    `;
    
    const result = await db.query(query, [tripId]);
    return result.rows[0] || null;
  }

  /**
   * Update trip status
   */
  static async updateStatus(tripId, status) {
    const query = 'UPDATE trips SET status = $1 WHERE trip_id = $2 RETURNING *';
    const result = await db.query(query, [status, tripId]);
    return result.rows[0];
  }

  /**
   * Delete trip (and cascade delete detours)
   */
  static async delete(tripId) {
    const query = 'DELETE FROM trips WHERE trip_id = $1';
    await db.query(query, [tripId]);
  }
}

module.exports = Trip;
```

**File: `backend/app/models/Detour.js`**
```javascript
const db = require('../../config/database');

class Detour {
  /**
   * Create a new detour
   */
  static async create({ tripId, placeId, placeName, placeType, location, rating, priceLevel, stopDurationMinutes, notes }) {
    const query = `
      INSERT INTO detours (
        trip_id, place_id, place_name, place_type, location, location_json,
        rating, price_level, stop_duration_minutes, notes
      )
      VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography, $7, $8, $9, $10, $11)
      RETURNING detour_id, place_name, place_type, location_json, rating, stop_duration_minutes, created_at
    `;
    const values = [
      tripId,
      placeId,
      placeName,
      placeType,
      location.lng,
      location.lat,
      JSON.stringify(location),
      rating,
      priceLevel,
      stopDurationMinutes,
      notes
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Find detours within radius of a point
   */
  static async findNearby(lat, lng, radiusMeters = 5000, placeType = null) {
    let query = `
      SELECT 
        detour_id,
        place_name,
        place_type,
        location_json,
        rating,
        ST_Distance(
          location,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
        ) as distance_meters
      FROM detours
      WHERE ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
        $3
      )
    `;
    const values = [lat, lng, radiusMeters];
    
    if (placeType) {
      query += ' AND place_type = $4';
      values.push(placeType);
    }
    
    query += ' ORDER BY distance_meters LIMIT 20';
    
    const result = await db.query(query, values);
    return result.rows;
  }

  /**
   * Delete detour
   */
  static async delete(detourId) {
    const query = 'DELETE FROM detours WHERE detour_id = $1';
    await db.query(query, [detourId]);
  }
}

module.exports = Detour;
```

---

## Testing & Validation

### Step 1: Unit Tests for Models

**File: `backend/app/models/__tests__/User.test.js`**
```javascript
const User = require('../User');
const db = require('../../../config/database');

// Mock database
jest.mock('../../../config/database');

describe('User Model', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should create a new user', async () => {
    const mockUser = {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      created_at: new Date(),
    };

    db.query.mockResolvedValue({ rows: [mockUser] });

    const user = await User.create({
      email: 'test@example.com',
      username: 'testuser',
      passwordHash: 'hashed_password',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(user).toEqual(mockUser);
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  test('should find user by email', async () => {
    const mockUser = {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      username: 'testuser',
    };

    db.query.mockResolvedValue({ rows: [mockUser] });

    const user = await User.findByEmail('test@example.com');

    expect(user).toEqual(mockUser);
    expect(db.query).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      ['test@example.com']
    );
  });
});
```

### Step 2: Integration Test

**File: `backend/app/models/__tests__/integration.test.js`**
```javascript
const db = require('../../../config/database');
const User = require('../User');
const Trip = require('../Trip');

// Skip if no database connection (CI/CD)
const describeIfDb = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDb('Database Integration Tests', () => {
  let testUserId;

  beforeAll(async () => {
    // Create test user
    const user = await User.create({
      email: `test-${Date.now()}@example.com`,
      username: `testuser-${Date.now()}`,
      passwordHash: 'test_hash',
      firstName: 'Test',
      lastName: 'User',
    });
    testUserId = user.user_id;
  });

  afterAll(async () => {
    // Cleanup
    if (testUserId) {
      await db.query('DELETE FROM users WHERE user_id = $1', [testUserId]);
    }
    await db.pool.end();
  });

  test('should create and retrieve a trip', async () => {
    const trip = await Trip.create({
      userId: testUserId,
      tripName: 'Test Trip',
      origin: { lat: 37.7749, lng: -122.4194, address: 'San Francisco, CA' },
      destination: { lat: 37.8651, lng: -119.5383, address: 'Yosemite, CA' },
      routePolyline: 'test_polyline',
      distanceMeters: 280000,
      durationSeconds: 12600,
      departureTime: new Date(),
    });

    expect(trip.trip_id).toBeDefined();
    expect(trip.trip_name).toBe('Test Trip');

    const trips = await Trip.findByUserId(testUserId);
    expect(trips.length).toBeGreaterThan(0);
    expect(trips[0].trip_id).toBe(trip.trip_id);
  });
});
```

### Step 3: Run Tests

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- User.test.js
```

---

## Production Deployment

### Step 1: Environment Configuration

**Azure App Service Environment Variables:**
```bash
# Set environment variables in Azure App Service
az webapp config appsettings set \
  --resource-group jauntdetour-rg \
  --name jauntdetour-api \
  --settings \
    DB_HOST=jauntdetour-db-prod.postgres.database.azure.com \
    DB_PORT=5432 \
    DB_NAME=jauntdetour \
    DB_USER=jauntdetour_app \
    DB_PASSWORD='ProdSecurePassword123!' \
    NODE_ENV=production
```

### Step 2: SSL Certificate Configuration

```bash
# Download Azure PostgreSQL SSL certificate
curl -o BaltimoreCyberTrustRoot.crt.pem https://www.digicert.com/CACerts/BaltimoreCyberTrustRoot.crt.pem

# Update database.js to use certificate
# ssl: {
#   rejectUnauthorized: true,
#   ca: fs.readFileSync('./BaltimoreCyberTrustRoot.crt.pem').toString()
# }
```

### Step 3: Connection Pooling

**Update `backend/config/database.js` for production:**
```javascript
const dbConfig = {
  // ... existing config
  
  // Production-optimized pool settings
  max: process.env.NODE_ENV === 'production' ? 30 : 10,
  min: 2,  // Always keep 2 connections open
  idleTimeoutMillis: 60000,  // Close idle connections after 1 minute
  connectionTimeoutMillis: 3000,
  
  // Statement timeout (30 seconds)
  statement_timeout: 30000,
  
  // Query timeout
  query_timeout: 30000,
};
```

### Step 4: Deploy Database Schema

```bash
# Connect to production database
psql "host=jauntdetour-db-prod.postgres.database.azure.com \
      port=5432 \
      dbname=jauntdetour \
      user=dbadmin \
      sslmode=require"

# Run schema
\i docs/database-schema.sql

# Verify
\dt
\di
```

---

## Monitoring & Maintenance

### Step 1: Enable Azure Monitor

```bash
# Enable query performance insights
az postgres flexible-server parameter set \
  --resource-group jauntdetour-rg \
  --server-name jauntdetour-db-prod \
  --name pg_stat_statements.track \
  --value all

# Set up monitoring alerts
az monitor metrics alert create \
  --name high-cpu-alert \
  --resource-group jauntdetour-rg \
  --scopes /subscriptions/{subscription-id}/resourceGroups/jauntdetour-rg/providers/Microsoft.DBforPostgreSQL/flexibleServers/jauntdetour-db-prod \
  --condition "avg Percentage CPU > 80" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action-group {action-group-id}
```

### Step 2: Query Performance Monitoring

```sql
-- View slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;

-- View index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- View table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Step 3: Automated Backups

```bash
# Verify backup configuration
az postgres flexible-server show \
  --resource-group jauntdetour-rg \
  --name jauntdetour-db-prod \
  --query '{backupRetentionDays:backup.backupRetentionDays, geoRedundantBackup:backup.geoRedundantBackup}'

# List available backups
az postgres flexible-server backup list \
  --resource-group jauntdetour-rg \
  --server-name jauntdetour-db-prod
```

### Step 4: Maintenance Windows

```bash
# Set maintenance window (Sunday 2 AM EST)
az postgres flexible-server update \
  --resource-group jauntdetour-rg \
  --name jauntdetour-db-prod \
  --maintenance-window \
    day-of-week=0 \
    start-hour=2 \
    start-minute=0 \
    custom-window=Enabled
```

---

## Troubleshooting

### Connection Issues

**Problem:** Can't connect to database
```bash
# Test connectivity
psql "host=jauntdetour-db-dev.postgres.database.azure.com \
      port=5432 \
      dbname=postgres \
      user=dbadmin \
      sslmode=require"

# Check firewall rules
az postgres flexible-server firewall-rule list \
  --resource-group jauntdetour-rg \
  --name jauntdetour-db-dev

# Verify server status
az postgres flexible-server show \
  --resource-group jauntdetour-rg \
  --name jauntdetour-db-dev \
  --query state
```

### Performance Issues

**Problem:** Slow queries
```sql
-- Enable query logging
ALTER DATABASE jauntdetour SET log_min_duration_statement = 1000; -- Log queries > 1 second

-- Analyze query plan
EXPLAIN ANALYZE SELECT * FROM trips WHERE user_id = 'user-uuid-here';

-- Update table statistics
ANALYZE trips;
ANALYZE detours;

-- Reindex if needed
REINDEX TABLE trips;
```

### Storage Issues

**Problem:** Running out of storage
```bash
# Check current storage usage
az postgres flexible-server show \
  --resource-group jauntdetour-rg \
  --name jauntdetour-db-prod \
  --query 'storage'

# Increase storage (can only increase, not decrease)
az postgres flexible-server update \
  --resource-group jauntdetour-rg \
  --name jauntdetour-db-prod \
  --storage-size 256
```

---

## Checklist

### Development Setup
- [ ] Azure CLI installed and configured
- [ ] PostgreSQL client installed
- [ ] Resource group created
- [ ] PostgreSQL server provisioned (free tier)
- [ ] Firewall rules configured
- [ ] PostGIS extension enabled
- [ ] Schema applied
- [ ] Application user created
- [ ] Node.js pg library installed
- [ ] Database module implemented
- [ ] Environment variables configured
- [ ] Connection tested successfully

### Production Deployment
- [ ] Production PostgreSQL server provisioned
- [ ] VNet integration configured
- [ ] High availability enabled
- [ ] Geo-redundant backups enabled
- [ ] SSL certificate configured
- [ ] Application user created (separate from admin)
- [ ] Schema applied
- [ ] Connection pooling optimized
- [ ] Monitoring alerts configured
- [ ] Maintenance window scheduled
- [ ] Backup tested (restore verification)
- [ ] Performance baseline established

### Documentation
- [ ] Connection strings documented
- [ ] Backup/restore procedures documented
- [ ] Runbook for common issues created
- [ ] Team trained on PostgreSQL basics
- [ ] Monitoring dashboard created

---

**Next Steps:**
1. Complete development setup
2. Integrate with existing backend API
3. Run performance tests
4. Plan production migration
5. Schedule team training session

**Resources:**
- [Azure PostgreSQL Documentation](https://docs.microsoft.com/azure/postgresql/)
- [PostgreSQL Official Docs](https://www.postgresql.org/docs/14/index.html)
- [PostGIS Documentation](https://postgis.net/docs/)
- [Node.js pg Documentation](https://node-postgres.com/)
