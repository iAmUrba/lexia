CREATE TABLE IF NOT EXISTS system_metadata (
    schema_version TEXT NOT NULL,
    core_version TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_migration TEXT NOT NULL,
    database_uuid TEXT NOT NULL
);

-- We initialize it with a dummy row, which will be updated
-- or we can just keep it as a single row table
INSERT INTO system_metadata (schema_version, core_version, last_migration, database_uuid) 
VALUES ('1.0', '1.0.0', '001_initial_schema.sql', lower(hex(randomblob(16))));
