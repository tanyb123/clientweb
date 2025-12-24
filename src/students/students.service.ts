import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class StudentsService {
  constructor(private readonly databaseService: DatabaseService) {}

  // VULNERABLE: SQL injection - direct string interpolation
  // Cộng chuỗi trực tiếp -> Mời hacker xơi (để test WAF)
  async searchStudents(searchQuery: string): Promise<any[]> {
    let query: string;
    
    if (searchQuery) {
      // VULNERABLE: SQL injection - KHÔNG escape, cộng chuỗi trực tiếp
      query = `SELECT * FROM students WHERE full_name LIKE '%${searchQuery}%' OR student_code LIKE '%${searchQuery}%' OR email LIKE '%${searchQuery}%' ORDER BY id DESC`;
    } else {
      query = 'SELECT * FROM students ORDER BY id DESC';
    }
    
    return await this.databaseService.query(query);
  }

  // VULNERABLE: SQL injection
  async addStudent(student: {
    student_code: string;
    full_name: string;
    email: string;
    phone: string;
    class_name: string;
    gpa: number;
  }): Promise<void> {
    // VULNERABLE: SQL injection - escape single quotes for PostgreSQL
    const escape = (str: string) => str.replace(/'/g, "''");
    const query = `INSERT INTO students (student_code, full_name, email, phone, class_name, gpa) VALUES ('${escape(student.student_code)}', '${escape(student.full_name)}', '${escape(student.email)}', '${escape(student.phone)}', '${escape(student.class_name)}', ${student.gpa})`;
    await this.databaseService.exec(query);
  }

  // VULNERABLE: SQL injection
  async updateStudent(id: number, student: {
    student_code: string;
    full_name: string;
    email: string;
    phone: string;
    class_name: string;
    gpa: number;
  }): Promise<void> {
    // VULNERABLE: SQL injection - escape single quotes for PostgreSQL
    const escape = (str: string) => str.replace(/'/g, "''");
    const query = `UPDATE students SET student_code='${escape(student.student_code)}', full_name='${escape(student.full_name)}', email='${escape(student.email)}', phone='${escape(student.phone)}', class_name='${escape(student.class_name)}', gpa=${student.gpa} WHERE id=${id}`;
    await this.databaseService.exec(query);
  }

  // VULNERABLE: SQL injection
  async deleteStudent(id: number): Promise<void> {
    // VULNERABLE: SQL injection
    const query = `DELETE FROM students WHERE id=${id}`;
    await this.databaseService.exec(query);
  }

  async getStatistics(): Promise<{ total_students: number; avg_gpa: number }> {
    const result = await this.databaseService.query('SELECT COUNT(*) as count, AVG(gpa) as avg_gpa FROM students');
    
    if (result.length > 0) {
      return {
        total_students: parseInt(result[0].count) || 0,
        avg_gpa: parseFloat(result[0].avg_gpa) || 0,
      };
    }
    
    return {
      total_students: 0,
      avg_gpa: 0,
    };
  }
}
