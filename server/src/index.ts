import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

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

const app = express();
const PORT = process.env.PORT || 5000;

// Security and CORS middleware
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

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
