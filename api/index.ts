import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import * as express from 'express';
import * as session from 'express-session';
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
  
  // Session configuration
  expressApp.use(
    session({
      secret: process.env.SESSION_SECRET || 'waf-test-secret-key-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      },
    } as any),
  );

  // Parse form data and JSON
  expressApp.use(express.urlencoded({ extended: true }));
  expressApp.use(express.json());

  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  // Serve static files
  app.useStaticAssets(join(process.cwd(), 'static'), {
    prefix: '/static/',
  });

  await app.init();
  cachedApp = expressApp;

  return expressApp;
}

export default async function handler(req: express.Request, res: express.Response) {
  try {
    const app = await createApp();
    return app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
