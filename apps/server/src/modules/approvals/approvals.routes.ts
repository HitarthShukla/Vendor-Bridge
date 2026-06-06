import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { approvalService } from './approvals.service';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { ApproveSchema, RejectSchema } from '@vendorbridge/shared';
import { ok, created } from '../../lib/response';

export const approvalRoutes = Router();

approvalRoutes.use(authenticate);

approvalRoutes.get('/', authorize('ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const approvals = await approvalService.findAll();
    ok(res, approvals);
  } catch (error) { next(error); }
});

approvalRoutes.get('/pending', authorize('MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const approvals = await approvalService.findPending(req.user!.userId);
    ok(res, approvals);
  } catch (error) { next(error); }
});

approvalRoutes.post('/request', authorize('ADMIN', 'PROCUREMENT_OFFICER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { quotationId, approverId } = req.body;
    const approval = await approvalService.requestApproval(quotationId, approverId, req.user!.userId);
    created(res, approval, 'Approval requested');
  } catch (error) { next(error); }
});

approvalRoutes.patch('/:id/approve', authorize('MANAGER'), validate(ApproveSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const approval = await approvalService.approve(req.params.id!, req.body.remarks, req.user!.userId);
    ok(res, approval, 'Quotation approved');
  } catch (error) { next(error); }
});

approvalRoutes.patch('/:id/reject', authorize('MANAGER'), validate(RejectSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const approval = await approvalService.reject(req.params.id!, req.body.remarks, req.user!.userId);
    ok(res, approval, 'Quotation rejected');
  } catch (error) { next(error); }
});
