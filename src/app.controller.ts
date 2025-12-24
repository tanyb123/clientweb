import { Controller, Get, Post, Res, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { DatabaseService } from './database/database.service';

@Controller()
export class AppController {
  constructor(private readonly databaseService: DatabaseService) {}

  private renderTemplate(pageTemplate: string, baseTemplate: string, data?: any): string {
    // Extract content from page template
    const contentMatch = pageTemplate.match(/{%\s*block\s+content\s*%}([\s\S]*?){%\s*endblock\s*%}/);
    let content = contentMatch ? contentMatch[1] : pageTemplate;
    
    // Replace template variables if data provided
    if (data) {
      if (data.error) {
        content = content.replace(/\{%\s*if\s+error\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g, (match, p1) => {
          return p1.replace(/\{\{\s*error\s*\}\}/g, this.escapeHtml(data.error));
        });
      } else {
        content = content.replace(/\{%\s*if\s+error\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g, '');
      }
    }
    
    // Extract extra_js if exists
    const extraJsMatch = pageTemplate.match(/{%\s*block\s+extra_js\s*%}([\s\S]*?){%\s*endblock\s*%}/);
    const extraJs = extraJsMatch ? extraJsMatch[1] : '';
    
    // Insert into base template
    let finalTemplate = baseTemplate.replace('<!-- CONTENT_PLACEHOLDER -->', content);
    finalTemplate = finalTemplate.replace('<!-- EXTRA_JS_PLACEHOLDER -->', extraJs);
    
    return finalTemplate;
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

  @Get()
  home(@Res() res: Response, @Req() req: Request) {
    // Check authentication via cookie (works on serverless)
    const isAuthenticated = req.cookies?.authenticated === 'true';
    if (!isAuthenticated) {
      return res.redirect('/login');
    }
    
    const baseTemplate = readFileSync(join(process.cwd(), 'templates', 'base.html'), 'utf8');
    const pageTemplate = readFileSync(join(process.cwd(), 'templates', 'home.html'), 'utf8');
    const finalTemplate = this.renderTemplate(pageTemplate, baseTemplate);
    res.send(finalTemplate);
  }

  @Get('login')
  login(@Res() res: Response, @Req() req: Request) {
    // If already logged in, redirect to students
    const isAuthenticated = req.cookies?.authenticated === 'true';
    if (isAuthenticated) {
      return res.redirect('/students');
    }
    
    const loginTemplate = readFileSync(join(process.cwd(), 'templates', 'login.html'), 'utf8');
    res.send(loginTemplate);
  }

  @Post('login')
  async loginPost(@Res() res: Response, @Req() req: Request) {
    const username = req.body.username;
    const password = req.body.password;
    
    // VULNERABLE: SQL injection - query database with direct string interpolation
    const authenticated = await this.databaseService.authenticateUser(username, password);
    
    if (authenticated) {
      // Set authentication cookie (works on serverless)
      res.cookie('authenticated', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax',
      });
      res.cookie('username', username, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax',
      });
      return res.redirect('/students');
    } else {
      // Redirect back to login with error message
      return res.redirect('/login?error=' + encodeURIComponent('Invalid username or password'));
    }
  }

  @Get('logout')
  logout(@Res() res: Response, @Req() req: Request) {
    // Clear authentication cookies
    res.clearCookie('authenticated');
    res.clearCookie('username');
    res.redirect('/login');
  }
}
