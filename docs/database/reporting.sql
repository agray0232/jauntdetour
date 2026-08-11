-- Aggregate-only reporting surface for Power BI.
-- Run as the database administrator after schema.sql.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'jauntdetour_reporting') THEN
        CREATE ROLE jauntdetour_reporting NOLOGIN;
    END IF;
END
$$;

DO $$
BEGIN
    EXECUTE format(
        'GRANT CONNECT ON DATABASE %I TO jauntdetour_reporting',
        current_database()
    );
END
$$;

CREATE SCHEMA IF NOT EXISTS reporting;
REVOKE ALL ON SCHEMA reporting FROM PUBLIC;
REVOKE CREATE, USAGE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO jauntdetour_app;

CREATE OR REPLACE VIEW reporting.overview AS
SELECT
    CURRENT_DATE AS report_date,
    (SELECT COUNT(*) FROM public.users) AS total_accounts,
    (SELECT COUNT(*) FROM public.users WHERE is_active = true) AS active_accounts,
    (SELECT COUNT(*) FROM public.trips) AS saved_jaunts,
    (SELECT COUNT(*) FROM public.detours) AS saved_detours,
    (SELECT COUNT(DISTINCT user_id) FROM public.trips) AS accounts_with_jaunts,
    COALESCE((
        SELECT ROUND(AVG(account_jaunts.jaunt_count), 2)
        FROM (
            SELECT users.user_id, COUNT(trips.trip_id)::numeric AS jaunt_count
            FROM public.users
            LEFT JOIN public.trips ON trips.user_id = users.user_id
            GROUP BY users.user_id
        ) AS account_jaunts
    ), 0) AS average_jaunts_per_account;

CREATE OR REPLACE VIEW reporting.daily_new_accounts AS
SELECT
    created_at::date AS activity_date,
    COUNT(*) AS new_accounts
FROM public.users
GROUP BY created_at::date;

CREATE OR REPLACE VIEW reporting.daily_saved_jaunts AS
SELECT
    created_at::date AS activity_date,
    COUNT(*) AS saved_jaunts,
    COUNT(DISTINCT user_id) AS distinct_creators
FROM public.trips
GROUP BY created_at::date;

CREATE OR REPLACE VIEW reporting.daily_saved_detours AS
SELECT
    created_at::date AS activity_date,
    COUNT(*) AS saved_detours
FROM public.detours
GROUP BY created_at::date;

CREATE OR REPLACE VIEW reporting.jaunts_per_account_distribution AS
WITH account_jaunts AS (
    SELECT users.user_id, COUNT(trips.trip_id) AS jaunt_count
    FROM public.users
    LEFT JOIN public.trips ON trips.user_id = users.user_id
    GROUP BY users.user_id
), bucketed AS (
    SELECT
        CASE
            WHEN jaunt_count = 0 THEN '0'
            WHEN jaunt_count = 1 THEN '1'
            WHEN jaunt_count <= 3 THEN '2-3'
            WHEN jaunt_count <= 5 THEN '4-5'
            ELSE '6+'
        END AS jaunt_count_bucket,
        CASE
            WHEN jaunt_count = 0 THEN 0
            WHEN jaunt_count = 1 THEN 1
            WHEN jaunt_count <= 3 THEN 2
            WHEN jaunt_count <= 5 THEN 3
            ELSE 4
        END AS bucket_order
    FROM account_jaunts
)
SELECT jaunt_count_bucket, bucket_order, COUNT(*) AS account_count
FROM bucketed
GROUP BY jaunt_count_bucket, bucket_order;

CREATE OR REPLACE VIEW reporting.detours_per_jaunt_distribution AS
WITH jaunt_detours AS (
    SELECT trips.trip_id, COUNT(detours.detour_id) AS detour_count
    FROM public.trips
    LEFT JOIN public.detours ON detours.trip_id = trips.trip_id
    GROUP BY trips.trip_id
), bucketed AS (
    SELECT
        CASE
            WHEN detour_count = 0 THEN '0'
            WHEN detour_count = 1 THEN '1'
            WHEN detour_count <= 3 THEN '2-3'
            WHEN detour_count <= 5 THEN '4-5'
            ELSE '6+'
        END AS detour_count_bucket,
        CASE
            WHEN detour_count = 0 THEN 0
            WHEN detour_count = 1 THEN 1
            WHEN detour_count <= 3 THEN 2
            WHEN detour_count <= 5 THEN 3
            ELSE 4
        END AS bucket_order
    FROM jaunt_detours
)
SELECT detour_count_bucket, bucket_order, COUNT(*) AS jaunt_count
FROM bucketed
GROUP BY detour_count_bucket, bucket_order;

CREATE OR REPLACE VIEW reporting.jaunt_status_counts AS
SELECT status, COUNT(*) AS jaunt_count
FROM public.trips
GROUP BY status;

CREATE OR REPLACE VIEW reporting.detour_category_counts AS
SELECT COALESCE(place_type, 'Unspecified') AS category, COUNT(*) AS detour_count
FROM public.detours
GROUP BY COALESCE(place_type, 'Unspecified');

GRANT USAGE ON SCHEMA reporting TO jauntdetour_reporting;
GRANT SELECT ON ALL TABLES IN SCHEMA reporting TO jauntdetour_reporting;
ALTER DEFAULT PRIVILEGES IN SCHEMA reporting
    GRANT SELECT ON TABLES TO jauntdetour_reporting;

REVOKE ALL ON ALL TABLES IN SCHEMA reporting FROM PUBLIC;

-- End of aggregate reporting setup.