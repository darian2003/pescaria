-- Add extra beds functionality

-- Add extra_beds column to umbrellas table
ALTER TABLE umbrellas ADD COLUMN IF NOT EXISTS extra_beds INTEGER NOT NULL DEFAULT 0;

-- Create extra_beds table to track extra bed rentals
CREATE TABLE IF NOT EXISTS extra_beds (
    id SERIAL PRIMARY KEY,
    umbrella_id INTEGER REFERENCES umbrellas(id) ON DELETE CASCADE,
    bed_number INTEGER NOT NULL, -- Which extra bed (1, 2, 3, etc.)
    status VARCHAR(20) NOT NULL CHECK (status IN ('free', 'rented_beach')),
    rented_by_username TEXT,
    started_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ended_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    price NUMERIC(10,2) NOT NULL DEFAULT 50,
    UNIQUE (umbrella_id, bed_number)
);

-- Add extra_beds_rented and extra_beds_earnings to daily_reports
ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS extra_beds_rented INTEGER NOT NULL DEFAULT 0;
ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS extra_beds_earnings NUMERIC(10,2) NOT NULL DEFAULT 0; 