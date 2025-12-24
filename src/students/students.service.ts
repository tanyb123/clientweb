import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class StudentsService {
  constructor(private readonly databaseService: DatabaseService) {}

  // VULNERABLE: SQL injection - direct string interpolation
  searchStudents(searchQuery: string): any[] {
    let query: string;
    
    if (searchQuery) {
      // VULNERABLE: SQL injection
      query = `SELECT * FROM students WHERE full_name LIKE '%${searchQuery}%' OR student_code LIKE '%${searchQuery}%' OR email LIKE '%${searchQuery}%' ORDER BY id DESC`;
    } else {
      query = 'SELECT * FROM students ORDER BY id DESC';
    }
    
    return this.databaseService.query(query);
  }

  // VULNERABLE: SQL injection
  addStudent(student: {
    student_code: string;
    full_name: string;
    email: string;
    phone: string;
    class_name: string;
    gpa: number;
  }): void {
    // VULNERABLE: SQL injection
    const query = `INSERT INTO students (student_code, full_name, email, phone, class_name, gpa) VALUES ('${student.student_code}', '${student.full_name}', '${student.email}', '${student.phone}', '${student.class_name}', ${student.gpa})`;
    this.databaseService.exec(query);
  }

  // VULNERABLE: SQL injection
  updateStudent(id: number, student: {
    student_code: string;
    full_name: string;
    email: string;
    phone: string;
    class_name: string;
    gpa: number;
  }): void {
    // VULNERABLE: SQL injection
    const query = `UPDATE students SET student_code='${student.student_code}', full_name='${student.full_name}', email='${student.email}', phone='${student.phone}', class_name='${student.class_name}', gpa=${student.gpa} WHERE id=${id}`;
    this.databaseService.exec(query);
  }

  // VULNERABLE: SQL injection
  deleteStudent(id: number): void {
    // VULNERABLE: SQL injection
    const query = `DELETE FROM students WHERE id=${id}`;
    this.databaseService.exec(query);
  }

  getStatistics(): { total_students: number; avg_gpa: number } {
    const result = this.databaseService.query('SELECT COUNT(*) as count, AVG(gpa) as avg_gpa FROM students');
    
    if (result.length > 0) {
      return {
        total_students: result[0].count || 0,
        avg_gpa: result[0].avg_gpa || 0,
      };
    }
    
    return {
      total_students: 0,
      avg_gpa: 0,
    };
  }
}
