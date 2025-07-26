-- Drop all tables in the correct order to handle foreign key constraints

-- Drop tables that depend on other tables first
DROP TABLE IF EXISTS daily_reports CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS rentals CASCADE;
DROP TABLE IF EXISTS beds CASCADE;

-- Drop independent tables
DROP TABLE IF EXISTS umbrellas CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Verify all tables are dropped
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'; 