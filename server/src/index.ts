import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { securityHeaders, rateLimiter } from './middleware/security';

dotenv.config();

import authRoutes from './routes/authRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import reviewRoutes from './routes/reviewRoutes';
import findingRoutes from './routes/findingRoutes';
import guidelineRoutes from './routes/guidelineRoutes';
import sourceRoutes from './routes/sourceRoutes';
import approvalRoutes from './routes/approvalRoutes';
import commentRoutes from './routes/commentRoutes';
import assetRoutes from './routes/assetRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import userRoutes from './routes/userRoutes';
import webhookRoutes from './routes/webhookRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// Apply enterprise security headers
app.use(securityHeaders);

// Security and CORS middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        process.env.CLIENT_ORIGIN || 'http://localhost:5173',
        'http://localhost:5000',
        'http://localhost:5173',
      ];
      if (allowedOrigins.includes(origin) || origin.startsWith('chrome-extension://')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev/hackathon demo mode
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Global API Rate Limiter: 300 requests per 5 minutes per IP
app.use('/api', rateLimiter({ windowMs: 5 * 60 * 1000, maxRequests: 300 }));

// Static uploads directory with security headers
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// System Health Check & AI Provider Info
app.get('/api/health', (_req: Request, res: Response) => {
  const provider = process.env.AI_PROVIDER || 'demo';
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'BrandGuard AI Governance Engine',
    aiProvider: provider.toUpperCase(),
    mode: provider.toLowerCase() === 'demo' ? 'Deterministic Demo Mode' : 'External LLM Enabled',
  });
});

// Mount API Routers
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/findings', findingRoutes);
app.use('/api/guidelines', guidelineRoutes);
app.use('/api/sources', sourceRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/reviews/:id/comments', commentRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/webhooks', webhookRoutes);

// Production Frontend Static Assets & SPA Fallback
const clientDistPath = path.join(__dirname, '../../client/dist');
const altClientDistPath = path.join(__dirname, '../client/dist');
const staticPath = fs.existsSync(clientDistPath) ? clientDistPath : altClientDistPath;

if (fs.existsSync(staticPath)) {
  app.use(express.static(staticPath));
  // All unhandled GET routes return the SPA index.html
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// Centralized Safe Error Handling Middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Server Error]:', err.message || err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'An unexpected server error occurred.',
    // Never expose stack trace or system secrets to client
  });
});

export default app;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🛡️  BrandGuard AI Server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🤖 AI Provider: ${(process.env.AI_PROVIDER || 'demo').toUpperCase()}`);
    console.log(`====================================================`);
  });
}
