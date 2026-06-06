import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';

// Module route imports
import { authRoutes } from './modules/auth/auth.routes';
import { vendorRoutes } from './modules/vendors/vendors.routes';
import { rfqRoutes } from './modules/rfq/rfq.routes';
import { quotationRoutes } from './modules/quotations/quotations.routes';
import { approvalRoutes } from './modules/approvals/approvals.routes';
import { purchaseOrderRoutes } from './modules/purchase-orders/po.routes';
import { invoiceRoutes } from './modules/invoices/invoices.routes';
import { reportRoutes } from './modules/reports/reports.routes';
import { aiRoutes } from './modules/ai-assistant/ai.routes';
import { activityLogRoutes } from './modules/activity-logs/activity-logs.routes';
import { notificationRoutes } from './modules/notifications/notifications.routes';

export function createApp() {
  const app = express();

  // ─── Global Middleware ────────────────────────────────────────────────────────

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(generalLimiter);

  // ─── Health Check ─────────────────────────────────────────────────────────────

  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    });
  });

  // ─── API Routes ───────────────────────────────────────────────────────────────

  app.use('/api/auth', authRoutes);
  app.use('/api/vendors', vendorRoutes);
  app.use('/api/rfqs', rfqRoutes);
  app.use('/api/quotations', quotationRoutes);
  app.use('/api/approvals', approvalRoutes);
  app.use('/api/purchase-orders', purchaseOrderRoutes);
  app.use('/api/invoices', invoiceRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/activity-logs', activityLogRoutes);
  app.use('/api/notifications', notificationRoutes);

  // ─── Static Files (uploads) ───────────────────────────────────────────────────

  app.use('/uploads', express.static('uploads'));

  // ─── Error Handling ───────────────────────────────────────────────────────────

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
