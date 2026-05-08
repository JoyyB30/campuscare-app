-- Seed categories

INSERT INTO categories (category_name, category_type)
VALUES
('Electrical', 'Maintenance'),
('Plumbing', 'Maintenance'),
('Furniture', 'Maintenance'),
('Cleaning', 'Service'),
('Air Conditioning', 'Maintenance');

-- Seed locations

INSERT INTO locations (
    building_name,
    floor,
    room_number,
    area,
    location_type,
    description
)
VALUES
('Building A', '1', '101', 'North Wing', 'indoor', 'Lecture Hall'),
('Building B', '2', '205', 'South Wing', 'indoor', 'Computer Lab'),
('Library', 'Ground', 'L1', 'Main Area', 'indoor', 'Study Area'),
('Cafeteria', 'Ground', 'C1', 'Food Court', 'indoor', 'Dining Area'),
('Parking Area', 'Outdoor', 'P1', 'East Side', 'outdoor', 'Student Parking');