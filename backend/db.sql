-- Create users table
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    created_at VARCHAR NOT NULL,
    password_hash VARCHAR NOT NULL
);

-- Seed the users table
INSERT INTO users (id, email, name, created_at, password_hash) VALUES
('user1', 'john.doe@example.com', 'John Doe', '2023-10-01T10:00:00Z', 'password123'),
('user2', 'jane.smith@example.com', 'Jane Smith', '2023-10-01T11:00:00Z', 'admin123');

-- Create user_dashboards table
CREATE TABLE user_dashboards (
    user_id VARCHAR PRIMARY KEY,
    carbon_footprint NUMERIC NOT NULL,
    historical_data TEXT,
    daily_tips TEXT,
    challenges TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Seed the user_dashboards table
INSERT INTO user_dashboards (user_id, carbon_footprint, historical_data, daily_tips, challenges) VALUES
('user1', 42.5, 'data1', 'tip1', 'challenge1'),
('user2', 38.7, 'data2', 'tip2', 'challenge2');

-- Create impact_calculators table
CREATE TABLE impact_calculators (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    travel_habits TEXT,
    energy_consumption TEXT,
    waste_management TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Seed the impact_calculators table
INSERT INTO impact_calculators (id, user_id, travel_habits, energy_consumption, waste_management) VALUES
('calculator1', 'user1', 'car', 'high', 'recycle'),
('calculator2', 'user2', 'bus', 'medium', 'compost');

-- Create eco_community_forum table
CREATE TABLE eco_community_forum (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    thread_title VARCHAR NOT NULL,
    content TEXT NOT NULL,
    created_at VARCHAR NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Seed the eco_community_forum table
INSERT INTO eco_community_forum (id, user_id, thread_title, content, created_at) VALUES
('thread1', 'user1', 'Sustainability Tips', 'Content of the first post.', '2023-10-02T12:00:00Z'),
('thread2', 'user2', 'Eco-Friendly Travel', 'Content of the second post.', '2023-10-02T13:00:00Z');

-- Create events table
CREATE TABLE events (
    id VARCHAR PRIMARY KEY,
    event_name VARCHAR NOT NULL,
    event_date VARCHAR NOT NULL,
    location VARCHAR,
    organizer_id VARCHAR NOT NULL,
    FOREIGN KEY (organizer_id) REFERENCES users(id)
);

-- Seed the events table
INSERT INTO events (id, event_name, event_date, location, organizer_id) VALUES
('event1', 'Earth Day Celebration', '2023-04-22', 'Central Park', 'user1'),
('event2', 'Recycling Workshop', '2023-05-15', 'Community Center', 'user2');

-- Create resource_library table
CREATE TABLE resource_library (
    id VARCHAR PRIMARY KEY,
    content_type VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    description TEXT,
    content_url VARCHAR,
    author_id VARCHAR NOT NULL,
    FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Seed the resource_library table
INSERT INTO resource_library (id, content_type, title, description, content_url, author_id) VALUES
('resource1', 'Video', 'How to Recycle', 'A video tutorial on recycling.', 'https://picsum.photos/200/300?random=1', 'user1'),
('resource2', 'Article', 'Sustainable Living', 'An article about sustainable living practices.', 'https://picsum.photos/200/300?random=2', 'user2');

-- Create alerts table
CREATE TABLE alerts (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    alert_type VARCHAR NOT NULL,
    message TEXT NOT NULL,
    created_at VARCHAR NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Seed the alerts table
INSERT INTO alerts (id, user_id, alert_type, message, created_at) VALUES
('alert1', 'user1', 'Reminder', 'Don’t forget about your next eco-challenge!', '2023-10-03T14:00:00Z'),
('alert2', 'user2', 'Alert', 'New sustainability event near you!', '2023-10-03T15:00:00Z');

-- Create authentication table
CREATE TABLE authentication (
    auth_token VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    is_authenticated BOOLEAN NOT NULL,
    is_loading BOOLEAN NOT NULL,
    error_message TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Seed the authentication table
INSERT INTO authentication (auth_token, user_id, is_authenticated, is_loading, error_message) VALUES
('token1', 'user1', TRUE, FALSE, NULL),
('token2', 'user2', FALSE, TRUE, 'Pending Authentication');