# WAF Testing Portal - NestJS Backend

A vulnerable web application designed for testing Web Application Firewalls (WAF) using NestJS backend.

## ⚠️ WARNING

**DO NOT deploy this application in production environments!** This application is intentionally vulnerable and should only be used in isolated testing environments.

## Tech Stack

- **Backend**: NestJS (Node.js/TypeScript)
- **Database**: SQLite (better-sqlite3)
- **Frontend**: HTML, CSS, JavaScript

## Installation

1. Install Node.js (v18 or higher)
2. Install dependencies:
```bash
npm install
```

## Running the Application

### Development mode (with hot reload):
```bash
npm run start:dev
```

### Production mode:
```bash
npm run build
npm run start:prod
```

### Simple start:
```bash
npm start
```

The application will start on `http://localhost:5000`

## Available Endpoints

- **Home**: `http://localhost:5000/`
- **Student Management**: `http://localhost:5000/students`
- **SQL Injection Test**: `http://localhost:5000/sql`
- **XSS Test**: `http://localhost:5000/xss`
- **Command Injection**: `http://localhost:5000/command`
- **File Operations**: `http://localhost:5000/file`

## Features

### Student Management System
- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Search functionality
- ✅ Statistics dashboard
- ⚠️ **SQL Injection vulnerabilities** in all operations

### Security Vulnerabilities (Intentional)

1. **SQL Injection** - All database queries use string interpolation
   - Search: `' OR '1'='1`
   - Add/Edit: Direct string concatenation in SQL
   - Delete: Unprotected ID parameter

2. **Cross-Site Scripting (XSS)** - Unfiltered user input

3. **Command Injection** - Unsafe command execution

4. **Path Traversal** - Unrestricted file access

## Test Cases for WAF Testing

### Student Management - SQL Injection

**Search:**
```
' OR '1'='1
' UNION SELECT NULL, NULL, NULL, NULL, NULL, NULL, NULL--
'; DROP TABLE students;--
```

**Add Student:**
- Student Code: `SV999' OR '1'='1`
- Full Name: `Test' OR '1'='1`

**Edit/Delete:**
- Manipulate ID parameter for SQL injection

## Project Structure

```
├── src/
│   ├── app.module.ts          # Main application module
│   ├── app.controller.ts      # Main routes controller
│   ├── main.ts                # Application entry point
│   ├── database/              # Database service
│   │   ├── database.module.ts
│   │   └── database.service.ts
│   └── students/              # Student management
│       ├── students.module.ts
│       ├── students.controller.ts
│       └── students.service.ts
├── templates/                 # HTML templates
├── static/                    # CSS, JS files
├── package.json
└── tsconfig.json
```

## License

This is a testing application. Use at your own risk.

