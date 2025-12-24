import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import * as express from 'express';
import * as session from 'express-session';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let cachedApp: express.Express;

async function createApp(): Promise<express.Express> {
  if (cachedApp) {
    return cachedApp;
  }

  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

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

  await app.init();
  cachedApp = expressApp;

  return expressApp;
}

export default async function handler(req: any, res: any) {
  const app = await createApp();
  return app(req, res);
}

