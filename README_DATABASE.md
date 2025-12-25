# Database Setup Instructions

## Neon PostgreSQL Database Setup

### 1. Tạo Tables và Data

Chạy file `database-setup.sql` trong Neon SQL Editor:

1. Mở Neon Console
2. Chọn database của bạn
3. Mở SQL Editor
4. Copy toàn bộ nội dung file `database-setup.sql`
5. Paste vào SQL Editor
6. Click "Run" để execute

### 2. Cấu trúc Tables

#### Table: `students`
- `id` - SERIAL PRIMARY KEY
- `student_code` - VARCHAR(50) UNIQUE
- `full_name` - VARCHAR(255)
- `email` - VARCHAR(255)
- `phone` - VARCHAR(50)
- `class_name` - VARCHAR(100)
- `gpa` - REAL
- `created_at` - TIMESTAMP

#### Table: `users`
- `id` - SERIAL PRIMARY KEY
- `username` - VARCHAR(255) UNIQUE
- `password` - VARCHAR(255)
- `created_at` - TIMESTAMP

### 3. Sample Data

Sau khi chạy script, bạn sẽ có:
- **5 students** với sample data
- **1 admin user**: `admin@usth.edu.vn` / `adminusth`

### 4. Connection String

Thêm vào file `.env`:
```
```

### 5. Verify Setup

Chạy query này để kiểm tra:
```sql
SELECT COUNT(*) as student_count FROM students;
SELECT COUNT(*) as user_count FROM users;
```

## SQL Commands Reference

### Thêm Student mới:
```sql
INSERT INTO students (student_code, full_name, email, phone, class_name, gpa)
VALUES ('SV006', 'Test Student', 'test@example.com', '0123456789', 'IT2024', 3.5);
```

### Xem tất cả Students:
```sql
SELECT * FROM students ORDER BY id DESC;
```

### Tìm kiếm Student:
```sql
SELECT * FROM students 
WHERE full_name LIKE '%Nguyen%' 
   OR student_code LIKE '%SV001%' 
   OR email LIKE '%example%';
```

### Thêm User mới:
```sql
INSERT INTO users (username, password)
VALUES ('newuser@example.com', 'password123');
```

### Xem tất cả Users:
```sql
SELECT id, username, created_at FROM users;
```

### Xóa Student:
```sql
DELETE FROM students WHERE id = 1;
```

### Update Student:
```sql
UPDATE students 
SET full_name = 'Updated Name', gpa = 4.0 
WHERE id = 1;
```

### Statistics:
```sql
SELECT 
  COUNT(*) as total_students,
  AVG(gpa) as avg_gpa,
  MAX(gpa) as max_gpa,
  MIN(gpa) as min_gpa
FROM students;
```

