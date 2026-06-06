import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { purchaseOrderService } from './po.service';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { CreatePurchaseOrderSchema } from '@vendorbridge/shared';
import { ok, created, paginated } from '../../lib/response';

export const purchaseOrderRoutes = Router();

purchaseOrderRoutes.use(authenticate);

purchaseOrderRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { purchaseOrders, meta } = await purchaseOrderService.findAll(req.query as any);
    paginated(res, purchaseOrders, meta);
  } catch (error) { next(error); }
});

purchaseOrderRoutes.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const po = await purchaseOrderService.findById(req.params.id!);
    ok(res, po);
  } catch (error) { next(error); }
});

purchaseOrderRoutes.post(
  '/',
  authorize('ADMIN', 'PROCUREMENT_OFFICER'),
  validate(CreatePurchaseOrderSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const po = await purchaseOrderService.create(
        req.body.quotationId,
        req.body.terms,
        req.body.deliveryDate,
        req.user!.userId
      );
      created(res, po, 'Purchase order created');
    } catch (error) { next(error); }
  }
);

purchaseOrderRoutes.patch(
  '/:id/confirm',
  authorize('ADMIN', 'PROCUREMENT_OFFICER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const po = await purchaseOrderService.confirm(req.params.id!, req.user!.userId);
      ok(res, po, 'Purchase order confirmed');
    } catch (error) { next(error); }
  }
);
