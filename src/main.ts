import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';
import * as dotenv from 'dotenv';
const session = require('express-session');
import { AppModule } from './app.module';

// Load environment variables
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Enable CORS if needed
  app.enableCors();
  
  // Session configuration
  app.use(
    session({
      secret: 'waf-test-secret-key-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    } as any),
  );
  
  // Parse cookies - IMPORTANT for authentication
  const cookieParser = require('cookie-parser');
  app.use(cookieParser());
  
  // Parse form data and JSON
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  
  // Serve static files
  app.useStaticAssets(join(process.cwd(), 'static'), {
    prefix: '/static/',
  });
  
  await app.listen(5000);
  console.log('🚀 NestJS Application is running on: http://localhost:5000');
  console.log('📚 Student Management: http://localhost:5000/students');
}

bootstrap();
