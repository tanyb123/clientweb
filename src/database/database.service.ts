import { Injectable, OnModuleInit } from '@nestjs/common';
import { Pool, QueryResult } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

@Injectable()
export class DatabaseService implements OnModuleInit {
  private pool: Pool;

  async onModuleInit() {
    // Load connection string from .env file
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_DB;
    
    if (!connectionString) {
      console.error('⚠️  DATABASE_URL or POSTGRES_DB environment variable is required');
      console.error('⚠️  Please set DATABASE_URL in Vercel Environment Variables');
      // Don't throw error, just log warning - app can still start
      return;
    }
    
    this.pool = new Pool({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    await this.initDatabase();
  }

  private async initDatabase() {
    try {
      // Create students table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS students (
          id SERIAL PRIMARY KEY,
          student_code VARCHAR(50) UNIQUE,
          full_name VARCHAR(255),
          email VARCHAR(255),
          phone VARCHAR(50),
          class_name VARCHAR(100),
          gpa REAL
        )
      `);

      // Create users table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE,
          password VARCHAR(255)
        )
      `);

      // Check if students table is empty and add sample data
      const studentResult = await this.pool.query('SELECT COUNT(*) as count FROM students');
      const studentCount = parseInt(studentResult.rows[0].count);

      if (studentCount === 0) {
        const sampleStudents = [
          ['SV001', 'Nguyen Van A', 'nguyenvana@example.com', '0123456789', 'IT2024', 3.75],
          ['SV002', 'Tran Thi B', 'tranthib@example.com', '0987654321', 'IT2024', 3.50],
          ['SV003', 'Le Van C', 'levanc@example.com', '0111222333', 'CS2024', 2.80],
          ['SV004', 'Pham Thi D', 'phamthid@example.com', '0999888777', 'CS2024', 3.90],
          ['SV005', 'Hoang Van E', 'hoangvane@example.com', '0555666777', 'IT2024', 2.50],
        ];

        for (const student of sampleStudents) {
          await this.pool.query(
            `INSERT INTO students (student_code, full_name, email, phone, class_name, gpa)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            student
          );
        }
      }

      // Check if users table is empty and add default user
      const userResult = await this.pool.query('SELECT COUNT(*) as count FROM users');
      const userCount = parseInt(userResult.rows[0].count);

      if (userCount === 0) {
        await this.pool.query(
          'INSERT INTO users (username, password) VALUES ($1, $2)',
          ['admin@usth.edu.vn', 'adminusth']
        );
      }
    } catch (error) {
      console.error('Database initialization error:', error);
    }
  }

  getPool(): Pool {
    return this.pool;
  }

  // VULNERABLE: SQL injection - direct string interpolation
  async query(sql: string): Promise<any[]> {
    try {
      // VULNERABLE: Direct SQL execution without parameterization
      const result: QueryResult = await this.pool.query(sql);
      return result.rows;
    } catch (error) {
      console.error('Query error:', error);
      return [];
    }
  }

  // VULNERABLE: SQL injection - direct string interpolation
  async exec(sql: string): Promise<void> {
    try {
      // VULNERABLE: Direct SQL execution without parameterization
      await this.pool.query(sql);
    } catch (error: any) {
      console.error('Exec error:', error);
      throw new Error(error.message || 'Database execution failed');
    }
  }

  // VULNERABLE: SQL injection - authenticate user from database
  async authenticateUser(username: string, password: string): Promise<boolean> {
    // VULNERABLE: SQL injection - direct string interpolation
    const query = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;
    const result = await this.query(query);
    return result.length > 0;
  }
}
