import { Controller, Get, Post, Body, Query, Res, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { StudentsService } from './students.service';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  // Helper to get cookies - fallback to parsing from header if req.cookies is undefined
  private getCookies(req: Request): any {
    if (req.cookies) {
      return req.cookies;
    }
    
    // Fallback: parse from cookie header
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) {
      return {};
    }
    
    const cookies: any = {};
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.trim().split('=');
      if (parts.length === 2) {
        const key = parts[0].trim();
        const value = decodeURIComponent(parts[1].trim());
        cookies[key] = value;
      }
    });
    
    return cookies;
  }

  @Get()
  async getStudents(@Query('search') search: string, @Res() res: Response, @Req() req: Request) {
    console.log('📚 [STUDENTS GET] Request received');
    console.log('📚 [STUDENTS GET] Request URL:', req.url);
    
    const cookies = this.getCookies(req);
    console.log('📚 [STUDENTS GET] Request cookies (parsed):', JSON.stringify(cookies));
    console.log('📚 [STUDENTS GET] Request headers:', JSON.stringify(req.headers));
    
    // Check authentication via cookie (works on serverless)
    const isAuthenticated = cookies?.authenticated === 'true';
    console.log('📚 [STUDENTS GET] Is authenticated:', isAuthenticated);
    console.log('📚 [STUDENTS GET] Cookie value:', cookies?.authenticated);
    
    if (!isAuthenticated) {
      console.log('❌ [STUDENTS GET] Not authenticated, redirecting to /login');
      res.redirect('/login');
      return;
    }
    
    console.log('✅ [STUDENTS GET] Authenticated, proceeding to load students...');
    
    const students = await this.studentsService.searchStudents(search || '');
    const stats = await this.studentsService.getStatistics();
    
    // Read base template
    let baseTemplate = readFileSync(join(process.cwd(), 'templates', 'base.html'), 'utf8');
    
    // Read students content
    let studentsTemplate = readFileSync(join(process.cwd(), 'templates', 'students.html'), 'utf8');
    
    // Extract content from students template (between {% block content %} and {% endblock %})
    const contentMatch = studentsTemplate.match(/{%\s*block\s+content\s*%}([\s\S]*?){%\s*endblock\s*%}/);
    const content = contentMatch ? contentMatch[1] : '';
    
    // Extract extra_js if exists
    const extraJsMatch = studentsTemplate.match(/{%\s*block\s+extra_js\s*%}([\s\S]*?){%\s*endblock\s*%}/);
    const extraJs = extraJsMatch ? extraJsMatch[1] : '';
    
    // Replace template variables in content
    let processedContent = this.replaceTemplate(content, {
      students: students,
      search_query: search || '',
      total_students: stats.total_students,
      avg_gpa: stats.avg_gpa,
      message: '',
      message_type: 'success',
    });
    
    // Insert content into base template (keep logout link since user is authenticated)
    let finalTemplate = baseTemplate.replace('<!-- CONTENT_PLACEHOLDER -->', processedContent);
    finalTemplate = finalTemplate.replace('<!-- EXTRA_JS_PLACEHOLDER -->', extraJs);
    
    res.send(finalTemplate);
  }

  @Post()
  async handleStudentAction(@Req() req: Request, @Res() res: Response) {
    // Check authentication via cookie (works on serverless)
    const cookies = this.getCookies(req);
    const isAuthenticated = cookies?.authenticated === 'true';
    if (!isAuthenticated) {
      return res.redirect('/login');
    }
    
    const body = req.body;
    const action = body.action;
    let message = '';
    let messageType = 'success';

    try {
      if (action === 'add') {
        try {
          await this.studentsService.addStudent({
            student_code: body.student_code,
            full_name: body.full_name,
            email: body.email,
            phone: body.phone,
            class_name: body.class_name,
            gpa: parseFloat(body.gpa),
          });
          message = `Student ${body.full_name} added successfully!`;
        } catch (addError: any) {
          if (addError.message && (addError.message.includes('UNIQUE constraint') || addError.message.includes('duplicate key'))) {
            message = `Error: Student code "${body.student_code}" already exists!`;
            messageType = 'error';
          } else {
            throw addError;
          }
        }
      } else if (action === 'edit') {
        await this.studentsService.updateStudent(parseInt(body.student_id), {
          student_code: body.student_code,
          full_name: body.full_name,
          email: body.email,
          phone: body.phone,
          class_name: body.class_name,
          gpa: parseFloat(body.gpa),
        });
        message = `Student ${body.full_name} updated successfully!`;
      } else if (action === 'delete') {
        await this.studentsService.deleteStudent(parseInt(body.student_id));
        message = 'Student deleted successfully!';
      }
    } catch (error) {
      message = `Error: ${error.message}`;
      messageType = 'error';
    }

    // Redirect back to students page with message
    const students = await this.studentsService.searchStudents('');
    const stats = await this.studentsService.getStatistics();
    
    // Read base template
    let baseTemplate = readFileSync(join(process.cwd(), 'templates', 'base.html'), 'utf8');
    
    // Read students content
    let studentsTemplate = readFileSync(join(process.cwd(), 'templates', 'students.html'), 'utf8');
    
    // Extract content
    const contentMatch = studentsTemplate.match(/{%\s*block\s+content\s*%}([\s\S]*?){%\s*endblock\s*%}/);
    const content = contentMatch ? contentMatch[1] : '';
    
    // Extract extra_js
    const extraJsMatch = studentsTemplate.match(/{%\s*block\s+extra_js\s*%}([\s\S]*?){%\s*endblock\s*%}/);
    const extraJs = extraJsMatch ? extraJsMatch[1] : '';
    
    // Replace template variables
    let processedContent = this.replaceTemplate(content, {
      students: students,
      search_query: '',
      total_students: stats.total_students,
      avg_gpa: stats.avg_gpa,
      message: message,
      message_type: messageType,
    });
    
    // Insert into base template (keep logout link since user is authenticated)
    let finalTemplate = baseTemplate.replace('<!-- CONTENT_PLACEHOLDER -->', processedContent);
    finalTemplate = finalTemplate.replace('<!-- EXTRA_JS_PLACEHOLDER -->', extraJs);
    
    res.send(finalTemplate);
  }

  private replaceTemplate(template: string, data: any): string {
    let result = template;
    
    // Remove all template tags first
    result = result.replace(/\{%\s*if\s+search_query\s*%\}/g, '');
    result = result.replace(/\{%\s*endif\s*%\}/g, '');
    result = result.replace(/\{%\s*if\s+students\s*%\}/g, '');
    result = result.replace(/\{%\s*if\s+message\s*%\}/g, '');
    
    // Handle search_query conditional - show Clear button only if search_query exists
    const clearButtonRegex = /\{%\s*if\s+search_query\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/;
    const clearButtonMatch = result.match(clearButtonRegex);
    if (clearButtonMatch) {
      if (data.search_query) {
        result = result.replace(clearButtonRegex, clearButtonMatch[1]);
      } else {
        result = result.replace(clearButtonRegex, '');
      }
    }
    
    // Replace search_query in input value
    result = result.replace(/value="\{\{\s*search_query\s*or\s*''\s*\}\}"/g, `value="${data.search_query || ''}"`);
    result = result.replace(/value="\{\{\s*search_query\s*\}\}"/g, `value="${data.search_query || ''}"`);
    
    // Replace statistics
    result = result.replace(/\{\{\s*total_students\s*\}\}/g, String(data.total_students));
    result = result.replace(/\{\{\s*avg_gpa\|round\(2\)\s*if\s*avg_gpa\s*else\s*'0.00'\s*\}\}/g, 
      data.avg_gpa ? data.avg_gpa.toFixed(2) : '0.00');
    
    // Handle students table - find the for loop block
    const forLoopRegex = /{%\s*for\s+student\s+in\s+students\s*%}([\s\S]*?){%\s*endfor\s*%}/;
    const forLoopMatch = template.match(forLoopRegex);
    
    if (forLoopMatch && data.students && data.students.length > 0) {
      const loopTemplate = forLoopMatch[1];
      // Convert students to array format [id, student_code, full_name, email, phone, class_name, gpa]
      const studentsArray = data.students.map((s: any) => [
        s.id,
        s.student_code,
        s.full_name,
        s.email,
        s.phone || '',
        s.class_name,
        s.gpa
      ]);
      
      const studentsRows = studentsArray.map((student: any[]) => {
        const gpaClass = student[6] >= 3.5 ? 'high' : student[6] >= 2.5 ? 'medium' : 'low';
        let row = loopTemplate;
        row = row.replace(/\{\{\s*student\[0\]\s*\}\}/g, String(student[0]));
        row = row.replace(/\{\{\s*student\[1\]\s*\}\}/g, this.escapeHtml(student[1]));
        row = row.replace(/\{\{\s*student\[2\]\s*\}\}/g, this.escapeHtml(student[2]));
        row = row.replace(/\{\{\s*student\[3\]\s*\}\}/g, this.escapeHtml(student[3]));
        row = row.replace(/\{\{\s*student\[4\]\s*\}\}/g, this.escapeHtml(student[4]));
        row = row.replace(/\{\{\s*student\[5\]\s*\}\}/g, this.escapeHtml(student[5]));
        row = row.replace(/\{\{\s*student\[6\]\s*\}\}/g, String(student[6]));
        row = row.replace(/\{\{\s*"%.2f"\|format\(student\[6\]\)\s*\}\}/g, student[6].toFixed(2));
        row = row.replace(/\{\{\s*'high'\s*if\s*student\[6\]\s*>=\s*3\.5\s*else\s*'medium'\s*if\s*student\[6\]\s*>=\s*2\.5\s*else\s*'low'\s*\}\}/g, gpaClass);
        // Data attributes for buttons (no need for tojson anymore)
        return row;
      }).join('');
      
      result = result.replace(forLoopRegex, studentsRows);
    } else if (forLoopMatch) {
      result = result.replace(forLoopRegex, '');
    }
    
    // Handle if students block (with else)
    const ifStudentsRegex = /{%\s*if\s+students\s*%}([\s\S]*?){%\s*else\s*%}([\s\S]*?){%\s*endif\s*%}/;
    const ifStudentsMatch = result.match(ifStudentsRegex);
    
    if (ifStudentsMatch) {
      if (data.students && data.students.length > 0) {
        result = result.replace(ifStudentsRegex, ifStudentsMatch[1]);
      } else {
        result = result.replace(ifStudentsRegex, ifStudentsMatch[2]);
      }
    }
    
    // Handle if students block (without else) - remove if empty
    const ifStudentsOnlyRegex = /{%\s*if\s+students\s*%}([\s\S]*?){%\s*endif\s*%}/;
    const ifStudentsOnlyMatch = result.match(ifStudentsOnlyRegex);
    if (ifStudentsOnlyMatch && (!data.students || data.students.length === 0)) {
      result = result.replace(ifStudentsOnlyRegex, '');
    } else if (ifStudentsOnlyMatch) {
      result = result.replace(ifStudentsOnlyRegex, ifStudentsOnlyMatch[1]);
    }
    
    // Handle message block
    const ifMessageRegex = /{%\s*if\s+message\s*%}([\s\S]*?){%\s*endif\s*%}/;
    const ifMessageMatch = result.match(ifMessageRegex);
    
    if (ifMessageMatch) {
      if (data.message) {
        let messageBlock = ifMessageMatch[1];
        messageBlock = messageBlock.replace(/\{\{\s*message\s*\}\}/g, this.escapeHtml(data.message));
        messageBlock = messageBlock.replace(/\{\{\s*message_type\s*\}\}/g, data.message_type);
        result = result.replace(ifMessageRegex, messageBlock);
      } else {
        result = result.replace(ifMessageRegex, '');
      }
    }
    
    // Clean up any remaining template tags that weren't processed
    result = result.replace(/\{%\s*[^%]*\s*%\}/g, '');
    result = result.replace(/\{\{\s*[^}]*\s*\}\}/g, '');
    
    return result;
  }

  private escapeHtml(text: string): string {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

