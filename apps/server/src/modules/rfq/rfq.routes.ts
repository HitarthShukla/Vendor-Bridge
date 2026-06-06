import { Router } from 'express';
import { rfqController } from './rfq.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/rbac';
import { validate, validateQuery } from '../../middleware/validate';
import { CreateRfqSchema, UpdateRfqSchema, PaginationSchema } from '@vendorbridge/shared';

export const rfqRoutes = Router();

rfqRoutes.use(authenticate);

rfqRoutes.get('/', validateQuery(PaginationSchema), rfqController.findAll);
rfqRoutes.get('/:id', rfqController.findById);
rfqRoutes.post('/', authorize('ADMIN', 'PROCUREMENT_OFFICER'), validate(CreateRfqSchema), rfqController.create);
rfqRoutes.patch('/:id', authorize('ADMIN', 'PROCUREMENT_OFFICER'), validate(UpdateRfqSchema), rfqController.update);
rfqRoutes.patch('/:id/publish', authorize('ADMIN', 'PROCUREMENT_OFFICER'), rfqController.publish);
rfqRoutes.patch('/:id/close', authorize('ADMIN', 'PROCUREMENT_OFFICER'), rfqController.close);
