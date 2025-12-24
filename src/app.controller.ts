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
  home(@Res() res: Response, @Req() req: Request) {
    // Check authentication via cookie (works on serverless)
    const cookies = this.getCookies(req);
    const isAuthenticated = cookies?.authenticated === 'true';
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
    const cookies = this.getCookies(req);
    const isAuthenticated = cookies?.authenticated === 'true';
    if (isAuthenticated) {
      return res.redirect('/students');
    }
    
    const loginTemplate = readFileSync(join(process.cwd(), 'templates', 'login.html'), 'utf8');
    res.send(loginTemplate);
  }

  @Post('login')
  async loginPost(@Res() res: Response, @Req() req: Request) {
    try {
      const username = req.body.username;
      const password = req.body.password;
      
      console.log('🔐 [LOGIN POST] Login attempt:', { username, passwordLength: password?.length });
      console.log('🔐 [LOGIN POST] Request URL:', req.url);
      console.log('🔐 [LOGIN POST] Request method:', req.method);
      console.log('🔐 [LOGIN POST] Request headers:', JSON.stringify(req.headers));
      
      // VULNERABLE: SQL injection - query database with direct string interpolation
      const authenticated = await this.databaseService.authenticateUser(username, password);
      
      console.log('🔐 [LOGIN POST] Authentication result:', authenticated);
      
      if (authenticated) {
        // Set authentication cookie (works on serverless)
        // Use secure: false for Vercel compatibility (Vercel handles HTTPS)
        const cookieOptions: any = {
          httpOnly: true,
          secure: false, // Vercel handles HTTPS, but we set to false for compatibility
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          sameSite: 'lax',
          path: '/',
        };
        
        console.log('🔐 [LOGIN POST] Setting cookies...');
        res.cookie('authenticated', 'true', cookieOptions);
        res.cookie('username', username, cookieOptions);
        
        console.log('✅ [LOGIN POST] Login successful, cookies set');
        console.log('✅ [LOGIN POST] Cookie options:', JSON.stringify(cookieOptions));
        console.log('🔄 [LOGIN POST] About to redirect to /students...');
        
        // Set redirect header and status
        res.status(302);
        res.setHeader('Location', '/students');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        console.log('✅ [LOGIN POST] Redirect headers set, sending response...');
        res.end();
        console.log('✅ [LOGIN POST] Response sent');
        return;
      } else {
        // Redirect back to login with error message
        console.log('❌ [LOGIN POST] Login failed, redirecting to /login with error');
        res.redirect('/login?error=' + encodeURIComponent('Invalid username or password'));
        return;
      }
    } catch (error: any) {
      console.error('❌ [LOGIN POST] Login error:', error);
      console.error('❌ [LOGIN POST] Error stack:', error.stack);
      res.redirect('/login?error=' + encodeURIComponent('Login failed: ' + (error.message || 'Unknown error')));
      return;
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
