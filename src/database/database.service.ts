import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface Student {
  id: number;
  student_code: string;
  full_name: string;
  email: string;
  phone: string;
  class_name: string;
  gpa: number;
}

interface User {
  id: number;
  username: string;
  password: string;
}

@Injectable()
export class DatabaseService implements OnModuleInit {
  private dbPath: string;
  private usersPath: string;
  private students: Student[] = [];
  private users: User[] = [];
  private nextId: number = 1;

  onModuleInit() {
    this.dbPath = path.join(process.cwd(), 'students.json');
    this.usersPath = path.join(process.cwd(), 'users.json');
    this.loadDatabase();
    this.initDatabase();
  }

  private loadDatabase() {
    // Load students
    if (fs.existsSync(this.dbPath)) {
      try {
        const data = fs.readFileSync(this.dbPath, 'utf8');
        this.students = JSON.parse(data);
        if (this.students.length > 0) {
          this.nextId = Math.max(...this.students.map(s => s.id)) + 1;
        }
      } catch (error) {
        this.students = [];
      }
    }
    
    // Load users
    if (fs.existsSync(this.usersPath)) {
      try {
        const data = fs.readFileSync(this.usersPath, 'utf8');
        this.users = JSON.parse(data);
      } catch (error) {
        this.users = [];
      }
    }
  }

  private saveDatabase() {
    fs.writeFileSync(this.dbPath, JSON.stringify(this.students, null, 2), 'utf8');
  }

  private saveUsers() {
    fs.writeFileSync(this.usersPath, JSON.stringify(this.users, null, 2), 'utf8');
  }

  private initDatabase() {
    // Init students
    if (this.students.length === 0) {
      const sampleStudents: Student[] = [
        { id: 1, student_code: 'SV001', full_name: 'Nguyen Van A', email: 'nguyenvana@example.com', phone: '0123456789', class_name: 'IT2024', gpa: 3.75 },
        { id: 2, student_code: 'SV002', full_name: 'Tran Thi B', email: 'tranthib@example.com', phone: '0987654321', class_name: 'IT2024', gpa: 3.50 },
        { id: 3, student_code: 'SV003', full_name: 'Le Van C', email: 'levanc@example.com', phone: '0111222333', class_name: 'CS2024', gpa: 2.80 },
        { id: 4, student_code: 'SV004', full_name: 'Pham Thi D', email: 'phamthid@example.com', phone: '0999888777', class_name: 'CS2024', gpa: 3.90 },
        { id: 5, student_code: 'SV005', full_name: 'Hoang Van E', email: 'hoangvane@example.com', phone: '0555666777', class_name: 'IT2024', gpa: 2.50 },
      ];
      this.students = sampleStudents;
      this.nextId = 6;
      this.saveDatabase();
    }
    
    // Init users
    if (this.users.length === 0) {
      this.users = [
        { id: 1, username: 'admin@usth.edu.vn', password: 'adminusth' },
      ];
      this.saveUsers();
    }
  }

  // VULNERABLE: SQL injection simulation - direct string interpolation in query
  query(sql: string): any[] {
    // Parse SQL query (vulnerable to injection)
    // This is intentionally vulnerable for WAF testing
    
    // Simple SQL parser for demonstration
    if (sql.includes('SELECT * FROM students')) {
      let results = [...this.students];
      
      // Handle WHERE clause (vulnerable)
      if (sql.includes('WHERE')) {
        const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER BY|\s*$)/i);
        if (whereMatch) {
          const condition = whereMatch[1];
          
          // VULNERABLE: Direct eval of condition (simulating SQL injection)
          // In real SQL, this would be vulnerable to injection
          try {
            // Simple LIKE matching
            if (condition.includes('LIKE')) {
              const likeMatch = condition.match(/(\w+)\s+LIKE\s+'%(.+?)%'/i);
              if (likeMatch) {
                const field = likeMatch[1].toLowerCase();
                const search = likeMatch[2].toLowerCase();
                results = results.filter((s: any) => {
                  const value = String(s[field] || '').toLowerCase();
                  return value.includes(search);
                });
              }
            }
            
            // Handle OR conditions
            if (condition.includes('OR')) {
              const orParts = condition.split(' OR ');
              const matches: any[] = [];
              orParts.forEach(part => {
                const likeMatch = part.match(/(\w+)\s+LIKE\s+'%(.+?)%'/i);
                if (likeMatch) {
                  const field = likeMatch[1].toLowerCase();
                  const search = likeMatch[2].toLowerCase();
                  this.students.forEach((s: any) => {
                    const value = String(s[field] || '').toLowerCase();
                    if (value.includes(search) && !matches.find(m => m.id === s.id)) {
                      matches.push(s);
                    }
                  });
                }
              });
              results = matches;
            }
          } catch (e) {
            // Ignore errors for vulnerability demonstration
          }
        }
      }
      
      // Handle ORDER BY
      if (sql.includes('ORDER BY')) {
        const orderMatch = sql.match(/ORDER BY\s+(\w+)\s+(ASC|DESC)?/i);
        if (orderMatch) {
          const field = orderMatch[1].toLowerCase();
          const direction = (orderMatch[2] || 'ASC').toUpperCase();
          results.sort((a: any, b: any) => {
            const aVal = a[field];
            const bVal = b[field];
            if (direction === 'DESC') {
              return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
            }
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
          });
        }
      }
      
      return results;
    }
    
    // Handle COUNT and AVG
    if (sql.includes('COUNT(*)') || sql.includes('AVG(gpa)')) {
      const count = this.students.length;
      const avgGpa = this.students.reduce((sum, s) => sum + s.gpa, 0) / count;
      return [{ count, avg_gpa: avgGpa }];
    }
    
    return [];
  }

  // VULNERABLE: SQL injection - direct string interpolation
  exec(sql: string): void {
    // Parse INSERT
    if (sql.includes('INSERT INTO students')) {
      // VULNERABLE: Extract values from SQL string directly
      const valuesMatch = sql.match(/VALUES\s*\((.+?)\)/i);
      if (valuesMatch) {
        // Simple parser - vulnerable to injection
        const values = valuesMatch[1].split(',').map(v => v.trim().replace(/^'|'$/g, ''));
        const student: Student = {
          id: this.nextId++,
          student_code: values[0] || '',
          full_name: values[1] || '',
          email: values[2] || '',
          phone: values[3] || '',
          class_name: values[4] || '',
          gpa: parseFloat(values[5]) || 0,
        };
        this.students.push(student);
        this.saveDatabase();
      }
    }
    
    // Parse UPDATE
    if (sql.includes('UPDATE students SET')) {
      const whereMatch = sql.match(/WHERE\s+id\s*=\s*(\d+)/i);
      if (whereMatch) {
        const id = parseInt(whereMatch[1]);
        const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i);
        if (setMatch) {
          const updates = setMatch[1].split(',').map(s => s.trim());
          const student = this.students.find(s => s.id === id);
          if (student) {
            updates.forEach(update => {
              const [field, value] = update.split('=').map(s => s.trim());
              const cleanValue = value.replace(/^'|'$/g, '');
              if (field === 'student_code') student.student_code = cleanValue;
              else if (field === 'full_name') student.full_name = cleanValue;
              else if (field === 'email') student.email = cleanValue;
              else if (field === 'phone') student.phone = cleanValue;
              else if (field === 'class_name') student.class_name = cleanValue;
              else if (field === 'gpa') student.gpa = parseFloat(value);
            });
            this.saveDatabase();
          }
        }
      }
    }
    
    // Parse DELETE
    if (sql.includes('DELETE FROM students')) {
      const whereMatch = sql.match(/WHERE\s+id\s*=\s*(\d+)/i);
      if (whereMatch) {
        const id = parseInt(whereMatch[1]);
        this.students = this.students.filter(s => s.id !== id);
        this.saveDatabase();
      }
    }
  }

  // VULNERABLE: SQL injection - authenticate user from database
  authenticateUser(username: string, password: string): boolean {
    // VULNERABLE: SQL injection - direct string interpolation
    const query = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;
    const result = this.queryUsers(query);
    return result.length > 0;
  }

  // Query users (vulnerable to SQL injection)
  private queryUsers(sql: string): User[] {
    // VULNERABLE: Simple SQL parser - vulnerable to injection
    if (sql.includes('SELECT * FROM users')) {
      let results = [...this.users];
      
      if (sql.includes('WHERE')) {
        const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s*$)/i);
        if (whereMatch) {
          const condition = whereMatch[1];
          
          // Handle AND conditions
          if (condition.includes('AND')) {
            const andParts = condition.split(' AND ');
            andParts.forEach(part => {
              const eqMatch = part.match(/(\w+)\s*=\s*'(.+?)'/i);
              if (eqMatch) {
                const field = eqMatch[1].toLowerCase();
                const value = eqMatch[2];
                results = results.filter((u: any) => {
                  return String(u[field]) === value;
                });
              }
            });
          } else {
            // Single condition
            const eqMatch = condition.match(/(\w+)\s*=\s*'(.+?)'/i);
            if (eqMatch) {
              const field = eqMatch[1].toLowerCase();
              const value = eqMatch[2];
              results = results.filter((u: any) => {
                return String(u[field]) === value;
              });
            }
          }
        }
      }
      
      return results;
    }
    
    return [];
  }
}
