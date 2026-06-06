import { Router } from 'express';
import { quotationController } from './quotations.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { CreateQuotationSchema } from '@vendorbridge/shared';

export const quotationRoutes = Router();

quotationRoutes.use(authenticate);

quotationRoutes.post('/', authorize('VENDOR'), validate(CreateQuotationSchema), quotationController.create);
quotationRoutes.patch('/:id/submit', authorize('VENDOR'), quotationController.submit);
quotationRoutes.patch('/:id/select', authorize('ADMIN', 'PROCUREMENT_OFFICER'), quotationController.select);
quotationRoutes.get('/rfq/:rfqId', quotationController.findByRfq);
quotationRoutes.get('/compare/:rfqId', authorize('ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER'), quotationController.compare);
