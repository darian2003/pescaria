-- USERS
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('staff', 'admin'))
);

-- UMBRELLAS
CREATE TABLE IF NOT EXISTS umbrellas (
    id SERIAL PRIMARY KEY,
    umbrella_number INTEGER UNIQUE NOT NULL
);

-- BED
CREATE TABLE IF NOT EXISTS beds (
    id SERIAL PRIMARY KEY,
    umbrella_id INTEGER REFERENCES umbrellas(id) ON DELETE CASCADE,
    side VARCHAR(10) NOT NULL CHECK (side IN ('left', 'right')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('free', 'rented_hotel', 'rented_beach')),
    rented_by_username TEXT, -- <-- Aceasta este linia corectă de adăugat aici
    UNIQUE (umbrella_id, side)
);

-- RENTALS
CREATE TABLE IF NOT EXISTS rentals (
    id SERIAL PRIMARY KEY,
    umbrella_id INTEGER REFERENCES umbrellas(id) ON DELETE CASCADE,
    side VARCHAR(10) NOT NULL CHECK (side IN ('left', 'right')),
    started_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ended_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    action VARCHAR(20) NOT NULL CHECK (action IN ('rented_hotel', 'rented_beach')),
    price NUMERIC(10,2) NOT NULL DEFAULT 0
);


-- SESSIONS (pentru token JWT activ)
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_valid BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS daily_reports (
    id SERIAL PRIMARY KEY,
    report_date DATE NOT NULL,
    total_rented_beach INTEGER NOT NULL,
    total_rented_hotel INTEGER NOT NULL,
    total_earnings NUMERIC(10,2) NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    staff_stats JSONB NOT NULL
);