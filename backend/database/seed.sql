-- ==========================================
-- Seed Users
-- ==========================================
INSERT INTO users (username, email, password, role, is_active)
VALUES
(
    'community1',
    'community1@example.com',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoOHI7v3K7.Lf0ypAWR5jx5qj8YhZPKQhm',
    'community_member',
    TRUE
),
(
    'manager1',
    'manager1@example.com',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoOHI7v3K7.Lf0ypAWR5jx5qj8YhZPKQhm',
    'facility_manager',
    TRUE
),
(
    'worker1',
    'worker1@example.com',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoOHI7v3K7.Lf0ypAWR5jx5qj8YhZPKQhm',
    'worker',
    TRUE
),
(
    'admin1',
    'admin1@example.com',
    '$2a$10$7EqJtq98hPqEX7vNZaFWoOHI7v3K7.Lf0ypAWR5jx5qj8YhZPKQhm',
    'admin',
    TRUE
);

-- IMPORTANT:
-- If admin login fails because of the hash typo above, run this corrected admin update:
UPDATE users
SET password = '$2a$10$7EqJtq98hPqEX7fNZaFWoOHI7v3K7.Lf0ypAWR5jx5qj8YhZPKQhm'
WHERE email = 'admin1@example.com';

-- ==========================================
-- Seed Categories
-- ==========================================
INSERT INTO categories (category_name, category_type, is_active)
VALUES
('Electrical', 'Maintenance', TRUE),
('Plumbing', 'Maintenance', TRUE),
('Furniture', 'Maintenance', TRUE),
('Cleaning', 'Service', TRUE),
('Air Conditioning', 'Maintenance', TRUE);

-- ==========================================
-- Seed Locations
-- ==========================================
INSERT INTO locations (
    building_name,
    floor,
    room_number,
    area,
    location_type,
    description,
    is_active
)
VALUES
('Building A', '1', '101', 'North Wing', 'indoor', 'Lecture Hall', TRUE),
('Building B', '2', '205', 'South Wing', 'indoor', 'Computer Lab', TRUE),
('Library', 'Ground', 'L1', 'Main Area', 'indoor', 'Study Area', TRUE),
('Cafeteria', 'Ground', 'C1', 'Food Court', 'indoor', 'Dining Area', TRUE),
('Parking Area', 'Outdoor', 'P1', 'East Side', 'outdoor', 'Student Parking', TRUE);

-- ==========================================
-- Seed Tickets / Issues
-- ==========================================
INSERT INTO tickets (
    title,
    description,
    photo_url,
    completed_photo_url,
    location_id,
    category_id,
    status,
    priority,
    created_by,
    assigned_to
)
VALUES
(
    'Broken chair in lecture hall',
    'One of the chairs is broken and unsafe for students to use.',
    NULL,
    NULL,
    1,
    3,
    'pending',
    'medium',
    1,
    NULL
),
(
    'Flickering light in computer lab',
    'The ceiling light keeps flickering during lectures and needs maintenance.',
    NULL,
    NULL,
    2,
    1,
    'assigned',
    'high',
    1,
    3
),
(
    'Water leak near cafeteria',
    'There is a small water leak near the cafeteria entrance.',
    NULL,
    NULL,
    4,
    2,
    'in_progress',
    'urgent',
    1,
    3
),
(
    'Overflowing trash bin in library',
    'The trash bin in the library main area is full and needs cleaning.',
    NULL,
    NULL,
    3,
    4,
    'resolved',
    'low',
    1,
    3
);

-- ==========================================
-- Seed Comments
-- ==========================================
INSERT INTO comments (comment_text, ticket_id, user_id)
VALUES
(
    'Worker assigned and will inspect the issue shortly.',
    2,
    3
),
(
    'The leak has been inspected. Repair is currently in progress.',
    3,
    3
),
(
    'Cleaning completed. Area is now clean.',
    4,
    3
);

-- ==========================================
-- Seed Photos
-- ==========================================
INSERT INTO photos (photo_url, photo_type, ticket_id, uploaded_by)
VALUES
(
    'https://via.placeholder.com/400x300.png?text=Issue+Photo',
    'issue',
    1,
    1
),
(
    'https://via.placeholder.com/400x300.png?text=Completion+Photo',
    'completion',
    4,
    3
);

-- Also update ticket 4 with completion photo URL for quick display
UPDATE tickets
SET completed_photo_url = 'https://via.placeholder.com/400x300.png?text=Completion+Photo'
WHERE ticket_id = 4;

-- ==========================================
-- Seed Notifications
-- ==========================================
INSERT INTO notifications (
    user_id,
    ticket_id,
    notification_type,
    message,
    is_read
)
VALUES
(
    2,
    1,
    'status_change',
    'New issue submitted: Broken chair in lecture hall',
    FALSE
),
(
    3,
    2,
    'assignment',
    'You have been assigned a new issue: Flickering light in computer lab',
    FALSE
),
(
    1,
    2,
    'status_change',
    'Your issue "Flickering light in computer lab" has been assigned to a worker',
    FALSE
),
(
    2,
    4,
    'completion',
    'Worker marked issue "Overflowing trash bin in library" as resolved',
    FALSE
),
(
    1,
    4,
    'status_change',
    'Your issue "Overflowing trash bin in library" has been marked as resolved',
    FALSE
);