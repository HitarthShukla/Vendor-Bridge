import { Router } from 'express';
import { vendorController } from './vendors.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/rbac';
import { validate, validateQuery } from '../../middleware/validate';
import { CreateVendorSchema, UpdateVendorSchema, PaginationSchema } from '@vendorbridge/shared';

export const vendorRoutes = Router();

vendorRoutes.use(authenticate);

vendorRoutes.get('/', validateQuery(PaginationSchema), vendorController.findAll);
vendorRoutes.get('/:id', vendorController.findById);
vendorRoutes.post('/', authorize('ADMIN', 'PROCUREMENT_OFFICER'), validate(CreateVendorSchema), vendorController.create);
vendorRoutes.patch('/:id', authorize('ADMIN', 'PROCUREMENT_OFFICER'), validate(UpdateVendorSchema), vendorController.update);
vendorRoutes.delete('/:id', authorize('ADMIN'), vendorController.remove);
