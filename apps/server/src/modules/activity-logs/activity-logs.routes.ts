import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { activityLogService } from './activity-logs.service';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/rbac';
import { ok } from '../../lib/response';

export const activityLogRoutes = Router();

activityLogRoutes.use(authenticate);
activityLogRoutes.use(authorize('ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER'));

activityLogRoutes.get('/recent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const logs = await activityLogService.findRecent(limit);
    ok(res, logs);
  } catch (error) {
    next(error);
  }
});

activityLogRoutes.get('/:entityType/:entityId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await activityLogService.findByEntity(req.params.entityType!, req.params.entityId!);
    ok(res, logs);
  } catch (error) {
    next(error);
  }
});
