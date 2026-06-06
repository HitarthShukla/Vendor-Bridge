import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { reportService } from './reports.service';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/rbac';
import { ok } from '../../lib/response';

export const reportRoutes = Router();

reportRoutes.use(authenticate);
reportRoutes.use(authorize('ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER'));

reportRoutes.get('/dashboard', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await reportService.getDashboardStats();
    ok(res, stats);
  } catch (error) { next(error); }
});

reportRoutes.get('/spend-summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as string) || 'monthly';
    const summary = await reportService.getSpendSummary(period as any);
    ok(res, summary);
  } catch (error) { next(error); }
});

reportRoutes.get('/vendor-performance', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const performance = await reportService.getVendorPerformance();
    ok(res, performance);
  } catch (error) { next(error); }
});
