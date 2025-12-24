import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import express, { Request, Response } from 'express';
import session from 'express-session';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config();

let cachedApp: express.Express;

async function createApp(): Promise<express.Express> {
  if (cachedApp) {
    return cachedApp;
  }

  const expressApp = express();
  
  // Session configuration - Use memory store for serverless
  const MemoryStore = require('memorystore')(session);
  expressApp.use(
    session({
      store: new MemoryStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      secret: process.env.SESSION_SECRET || 'waf-test-secret-key-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax',
      },
    } as any),
  );

  // Parse form data and JSON
  expressApp.use(express.urlencoded({ extended: true }));
  expressApp.use(express.json());

  // Serve static files BEFORE NestJS app creation
  expressApp.use('/static', express.static(join(process.cwd(), 'static')));

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  // Also serve via NestJS (backup)
  app.useStaticAssets(join(process.cwd(), 'static'), {
    prefix: '/static/',
  });

  await app.init();
  cachedApp = expressApp;

  return expressApp;
}

export default async function handler(req: Request, res: Response) {
  try {
    const app = await createApp();
    return app(req, res);
  } catch (error: any) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Internal server error', message: error?.message || 'Unknown error' });
  }
}
