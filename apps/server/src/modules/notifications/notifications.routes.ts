import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/db';
import { authenticate } from '../../middleware/authenticate';
import { ok } from '../../lib/response';

export const notificationRoutes = Router();

notificationRoutes.use(authenticate);

notificationRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { user_id: req.user!.userId },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
    ok(res, notifications);
  } catch (error) { next(error); }
});

notificationRoutes.get('/unread-count', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await prisma.notification.count({
      where: { user_id: req.user!.userId, is_read: false },
    });
    ok(res, { count });
  } catch (error) { next(error); }
});

notificationRoutes.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { is_read: true },
    });
    ok(res, notification);
  } catch (error) { next(error); }
});

notificationRoutes.patch('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { user_id: req.user!.userId, is_read: false },
      data: { is_read: true },
    });
    ok(res, null, 'All notifications marked as read');
  } catch (error) { next(error); }
});
