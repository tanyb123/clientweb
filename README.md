# WAF Testing Portal

A vulnerable web application designed for testing Web Application Firewalls (WAF). This application contains **intentional security vulnerabilities** for security testing purposes only.

## ⚠️ WARNING

**DO NOT deploy this application in production environments!** This application is intentionally vulnerable and should only be used in isolated testing environments.

## Features

This application includes multiple common web vulnerabilities:

1. **📚 Student Management System** - Full CRUD with SQL injection in search, add, edit, delete operations
2. **SQL Injection** - Vulnerable login and search functionality
3. **Cross-Site Scripting (XSS)** - Unfiltered user input
4. **Command Injection** - Unsafe command execution
5. **Path Traversal** - Unrestricted file access

## Installation

1. Install Python 3.7 or higher
2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Application

### Windows:
Double-click `run.bat` or run in terminal:
```bash
python app.py
```

### Linux/Mac:
```bash
chmod +x run.sh
./run.sh
```

Or directly:
```bash
python3 app.py
```

**Important:** The application will start on `http://localhost:5000` (NOT port 5500!)

After starting, open your browser and go to:
- Home: `http://localhost:5000/`
- Student Management: `http://localhost:5000/students`

## Test Cases for WAF Testing

### Student Management - SQL Injection Tests

**Search Students:**
- Search: `' OR '1'='1`
- Search: `' UNION SELECT NULL, NULL, NULL, NULL, NULL, NULL, NULL--`
- Search: `'; DROP TABLE students;--`
- Expected: SQL injection in search query

**Add/Edit Student:**
- Student Code: `SV999' OR '1'='1`
- Full Name: `Test' OR '1'='1`
- Expected: SQL injection in INSERT/UPDATE queries

### SQL Injection Tests

**Login Page:**
- Username: `admin' OR '1'='1`
- Password: `anything`
- Expected: Bypasses authentication

**Search Function:**
- Search: `' UNION SELECT NULL, NULL, NULL, NULL--`
- Expected: SQL injection payload

### XSS Tests

**Name Field:**
- Input: `<script>alert('XSS')</script>`
- Expected: Script execution

**Comment Field:**
- Input: `<img src=x onerror=alert('XSS')>`
- Expected: XSS payload execution

### Command Injection Tests

**Ping Host:**
- Input: `google.com; ls`
- Input: `google.com && whoami`
- Input: `google.com | cat /etc/passwd`
- Expected: Command execution

### Path Traversal Tests

**File Read:**
- Input: `../../../etc/passwd`
- Input: `..\\..\\..\\windows\\system32\\drivers\\etc\\hosts`
- Expected: File access outside web root

## Security Notes

All vulnerabilities in this application are intentional and designed to:
- Test WAF rule effectiveness
- Demonstrate common attack vectors
- Provide a safe testing environment

## License

This is a testing application. Use at your own risk.

