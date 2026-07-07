-- Local development only: create the least-privilege application user.
-- Mirrors the production setup (the app connects as jauntdetour_app, never as the
-- superuser). Runs after 01-schema.sql so the tables it grants on already exist.
-- The password here is a throwaway LOCAL value and must match DB_PASSWORD in
-- .devcontainer/devcontainer.env.

CREATE USER jauntdetour_app WITH PASSWORD 'localdevapp';

GRANT CONNECT ON DATABASE jauntdetour TO jauntdetour_app;
GRANT USAGE ON SCHEMA public TO jauntdetour_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO jauntdetour_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO jauntdetour_app;

-- Ensure the app user also gets privileges on any tables created later.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO jauntdetour_app;
