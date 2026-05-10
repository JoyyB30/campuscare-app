-- Users Table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (
        role IN ('community_member', 'facility_manager', 'worker', 'admin')
    ),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Locations Table
CREATE TABLE locations (
    location_id SERIAL PRIMARY KEY,
    building_name VARCHAR(100) NOT NULL,
    floor VARCHAR(20),
    room_number VARCHAR(50),
    area VARCHAR(100),
    location_type VARCHAR(20) CHECK (
        location_type IN ('indoor', 'outdoor')
    ),
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE
);

-- Categories Table
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL,
    category_type VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE
);

-- Tickets Table
CREATE TABLE tickets (
    ticket_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(500) NOT NULL,

    -- Original issue photo uploaded by Community Member
    photo_url VARCHAR(500),

    -- Completion photo uploaded by Worker
    completed_photo_url VARCHAR(500),

    location_id INT REFERENCES locations(location_id),
    category_id INT REFERENCES categories(category_id),

    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending', 'assigned', 'in_progress', 'resolved', 'closed')
    ),

    priority VARCHAR(20) DEFAULT 'medium' CHECK (
        priority IN ('low', 'medium', 'high', 'urgent')
    ),

    created_by INT REFERENCES users(user_id),
    assigned_to INT REFERENCES users(user_id),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Comments Table
CREATE TABLE comments (
    comment_id SERIAL PRIMARY KEY,
    comment_text VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),

    ticket_id INT REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    user_id INT REFERENCES users(user_id)
);

-- Photos Table
CREATE TABLE photos (
    photo_id SERIAL PRIMARY KEY,
    photo_url VARCHAR(500) NOT NULL,

    photo_type VARCHAR(20) CHECK (
        photo_type IN ('issue', 'completion')
    ),

    uploaded_at TIMESTAMP DEFAULT NOW(),

    ticket_id INT REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    uploaded_by INT REFERENCES users(user_id)
);

-- Notifications Table
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,

    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    ticket_id INT REFERENCES tickets(ticket_id) ON DELETE CASCADE,

    notification_type VARCHAR(30) CHECK (
        notification_type IN ('status_change', 'assignment', 'completion')
    ),

    message VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Helpful Indexes
CREATE INDEX idx_tickets_created_by ON tickets(created_by);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);