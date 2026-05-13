TRUNCATE TABLE notifications, photos, comments, tickets, categories, locations, users
RESTART IDENTITY CASCADE;

-- Password for all users: 123456
-- Hash below is bcrypt for: 123456

INSERT INTO users (username, email, password, role, is_active)
VALUES
(
    'Mariam Student',
    'member@campuscare.com',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoOHI7v3K7.Lf0ypAWR5jx5qj8YhZPKQhm',
    'community_member',
    TRUE
),
(
    'Omar Facility Manager',
    'manager@campuscare.com',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoOHI7v3K7.Lf0ypAWR5jx5qj8YhZPKQhm',
    'facility_manager',
    TRUE
),
(
    'Ahmed Maintenance Worker',
    'worker@campuscare.com',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoOHI7v3K7.Lf0ypAWR5jx5qj8YhZPKQhm',
    'worker',
    TRUE
),
(
    'CampusCare Admin',
    'admin@campuscare.com',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoOHI7v3K7.Lf0ypAWR5jx5qj8YhZPKQhm',
    'admin',
    TRUE
);

INSERT INTO categories (category_name, category_type, is_active)
VALUES
('Electrical', 'Maintenance', TRUE),
('Plumbing', 'Maintenance', TRUE),
('Cleaning', 'Service', TRUE),
('Furniture', 'Maintenance', TRUE),
('Air Conditioning', 'Maintenance', TRUE),
('Safety', 'Urgent Maintenance', TRUE);

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
('Building A', '1', 'A101', 'North Wing', 'indoor', 'Lecture Hall A101', TRUE),
('Building B', '2', 'B205', 'South Wing', 'indoor', 'Computer Lab B205', TRUE),
('Library', 'Ground', 'L-G01', 'Main Reading Area', 'indoor', 'Main library study area', TRUE),
('Cafeteria', 'Ground', 'C-G01', 'Food Court', 'indoor', 'Main cafeteria entrance', TRUE),
('Parking Area', NULL, 'P1', 'East Side', 'outdoor', 'Student parking area', TRUE),
('Building C', '3', 'C303', 'West Wing', 'indoor', 'Seminar room C303', TRUE);

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
    assigned_to,
    created_at,
    updated_at
)
VALUES
(
    'Broken chair in lecture hall',
    'One of the chairs in Lecture Hall A101 is broken and unsafe for students to use.',
    'https://res.cloudinary.com/demo/image/upload/v1690000000/samples/chair.jpg',
    NULL,
    1,
    4,
    'pending',
    'medium',
    1,
    NULL,
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '4 days'
),
(
    'Flickering light in computer lab',
    'The ceiling light in Computer Lab B205 keeps flickering during lectures.',
    'https://res.cloudinary.com/demo/image/upload/v1690000000/samples/light.jpg',
    NULL,
    2,
    1,
    'assigned',
    'high',
    1,
    3,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '2 days'
),
(
    'Water leak near cafeteria entrance',
    'There is water leaking near the cafeteria entrance and the floor is becoming slippery.',
    'https://res.cloudinary.com/demo/image/upload/v1690000000/samples/water.jpg',
    NULL,
    4,
    2,
    'in_progress',
    'urgent',
    1,
    3,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day'
),
(
    'Overflowing trash bin in library',
    'The trash bin in the main library study area is full and needs cleaning.',
    'https://res.cloudinary.com/demo/image/upload/v1690000000/samples/people/bicycle.jpg',
    'https://res.cloudinary.com/demo/image/upload/v1690000000/samples/landscapes/nature-mountains.jpg',
    3,
    3,
    'resolved',
    'low',
    1,
    3,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '3 hours'
),
(
    'AC not cooling in seminar room',
    'The air conditioner in room C303 is running but the room is still very hot.',
    'https://res.cloudinary.com/demo/image/upload/v1690000000/samples/ecommerce/leather-bag-gray.jpg',
    NULL,
    6,
    5,
    'pending',
    'high',
    1,
    NULL,
    NOW() - INTERVAL '8 hours',
    NOW() - INTERVAL '8 hours'
);

INSERT INTO comments (comment_text, ticket_id, user_id)
VALUES
('I have received the assignment and will inspect the light today.', 2, 3),
('The leak area has been checked. Repair is currently in progress.', 3, 3),
('Cleaning completed. The library area is now clean.', 4, 3);

INSERT INTO photos (photo_url, photo_type, ticket_id, uploaded_by)
VALUES
('https://res.cloudinary.com/demo/image/upload/v1690000000/samples/chair.jpg', 'issue', 1, 1),
('https://res.cloudinary.com/demo/image/upload/v1690000000/samples/light.jpg', 'issue', 2, 1),
('https://res.cloudinary.com/demo/image/upload/v1690000000/samples/water.jpg', 'issue', 3, 1),
('https://res.cloudinary.com/demo/image/upload/v1690000000/samples/people/bicycle.jpg', 'issue', 4, 1),
('https://res.cloudinary.com/demo/image/upload/v1690000000/samples/landscapes/nature-mountains.jpg', 'completion', 4, 3);

INSERT INTO notifications (
    user_id,
    ticket_id,
    notification_type,
    message,
    is_read,
    created_at
)
VALUES
(2, 1, 'status_change', 'New issue submitted: Broken chair in lecture hall', FALSE, NOW() - INTERVAL '4 days'),
(3, 2, 'assignment', 'You have been assigned a new issue: Flickering light in computer lab', FALSE, NOW() - INTERVAL '2 days'),
(1, 2, 'status_change', 'Your issue "Flickering light in computer lab" has been assigned to a worker', FALSE, NOW() - INTERVAL '2 days'),
(2, 3, 'status_change', 'Worker updated issue "Water leak near cafeteria entrance"', FALSE, NOW() - INTERVAL '1 day'),
(2, 4, 'completion', 'Worker uploaded a completion photo for issue "Overflowing trash bin in library"', FALSE, NOW() - INTERVAL '3 hours'),
(1, 4, 'status_change', 'Your issue "Overflowing trash bin in library" has been marked as resolved', FALSE, NOW() - INTERVAL '3 hours');