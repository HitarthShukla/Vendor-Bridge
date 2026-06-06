import { Request, Response, NextFunction } from 'express';
import { vendorService } from './vendors.service';
import { ok, created, paginated, noContent } from '../../lib/response';

export const vendorController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const vendor = await vendorService.create(req.body, req.user!.userId);
      created(res, vendor, 'Vendor created successfully');
    } catch (error) {
      next(error);
    }
  },

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { vendors, meta } = await vendorService.findAll(req.query as any);
      paginated(res, vendors, meta);
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const vendor = await vendorService.findById(req.params.id!);
      ok(res, vendor);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const vendor = await vendorService.update(req.params.id!, req.body, req.user!.userId);
      ok(res, vendor, 'Vendor updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await vendorService.softDelete(req.params.id!, req.user!.userId);
      noContent(res);
    } catch (error) {
      next(error);
    }
  },
};
