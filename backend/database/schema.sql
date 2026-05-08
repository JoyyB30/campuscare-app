CREATE TABLE IF NOT EXISTS locations (
    location_id SERIAL PRIMARY KEY,
    building_name VARCHAR(100) NOT NULL,
    floor VARCHAR(20),
    room_number VARCHAR(50),
    area VARCHAR(100),
    location_type VARCHAR(20) CHECK (location_type IN ('indoor', 'outdoor')),
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL,
    category_type VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS tickets (
    ticket_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(500) NOT NULL,
    photo_url VARCHAR(500),
    location_id INT REFERENCES locations(location_id),
    category_id INT REFERENCES categories(category_id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_by INT REFERENCES users(user_id),
    assigned_to INT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);