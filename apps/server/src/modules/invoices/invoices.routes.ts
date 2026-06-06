import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { invoiceService } from './invoices.service';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { GenerateInvoiceSchema } from '@vendorbridge/shared';
import { ok, created, paginated } from '../../lib/response';

export const invoiceRoutes = Router();

invoiceRoutes.use(authenticate);

invoiceRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { invoices, meta } = await invoiceService.findAll(req.query as any);
    paginated(res, invoices, meta);
  } catch (error) { next(error); }
});

invoiceRoutes.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await invoiceService.findById(req.params.id!);
    ok(res, invoice);
  } catch (error) { next(error); }
});

invoiceRoutes.post(
  '/generate',
  authorize('ADMIN', 'PROCUREMENT_OFFICER'),
  validate(GenerateInvoiceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await invoiceService.generate(req.body.purchaseOrderId, req.body.dueDate, req.user!.userId);
      created(res, invoice, 'Invoice generated');
    } catch (error) { next(error); }
  }
);

invoiceRoutes.patch('/:id/send-email', authorize('ADMIN', 'PROCUREMENT_OFFICER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Queue email job via Bull
    const invoice = await invoiceService.markSent(req.params.id!, req.user!.userId);
    ok(res, invoice, 'Invoice sent');
  } catch (error) { next(error); }
});

invoiceRoutes.patch('/:id/mark-paid', authorize('ADMIN', 'PROCUREMENT_OFFICER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await invoiceService.markPaid(req.params.id!, req.user!.userId);
    ok(res, invoice, 'Invoice marked as paid');
  } catch (error) { next(error); }
});
