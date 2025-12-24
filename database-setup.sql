-- ============================================
-- Database Setup Script for Neon PostgreSQL
-- Run this script in Neon SQL Editor
-- ============================================

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  student_code VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  class_name VARCHAR(100),
  gpa REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample students data
INSERT INTO students (student_code, full_name, email, phone, class_name, gpa)
VALUES 
  ('SV001', 'Nguyen Van A', 'nguyenvana@example.com', '0123456789', 'IT2024', 3.75),
  ('SV002', 'Tran Thi B', 'tranthib@example.com', '0987654321', 'IT2024', 3.50),
  ('SV003', 'Le Van C', 'levanc@example.com', '0111222333', 'CS2024', 2.80),
  ('SV004', 'Pham Thi D', 'phamthid@example.com', '0999888777', 'CS2024', 3.90),
  ('SV005', 'Hoang Van E', 'hoangvane@example.com', '0555666777', 'IT2024', 2.50)
ON CONFLICT (student_code) DO NOTHING;

-- Insert default admin user
INSERT INTO users (username, password)
VALUES ('admin@usth.edu.vn', 'adminusth')
ON CONFLICT (username) DO NOTHING;

-- Verify data
SELECT 'Students count:' as info, COUNT(*) as count FROM students
UNION ALL
SELECT 'Users count:' as info, COUNT(*) as count FROM users;

-- View all students
SELECT * FROM students ORDER BY id DESC;

-- View all users (password hidden for security)
SELECT id, username, created_at FROM users;

