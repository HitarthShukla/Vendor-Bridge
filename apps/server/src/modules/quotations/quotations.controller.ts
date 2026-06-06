import { Request, Response, NextFunction } from 'express';
import { quotationService } from './quotations.service';
import { ok, created } from '../../lib/response';

export const quotationController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      // Get vendor ID from the user's vendor profile
      const { prisma } = await import('../../lib/db');
      const vendor = await prisma.vendor.findUnique({ where: { user_id: req.user!.userId } });
      if (!vendor) {
        return res.status(403).json({ success: false, error: { code: 'NOT_VENDOR', message: 'No vendor profile found' } });
      }
      const quotation = await quotationService.create(req.body, vendor.id, req.user!.userId);
      created(res, quotation, 'Quotation created');
    } catch (error) { next(error); }
  },

  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const quotation = await quotationService.submit(req.params.id!, req.user!.userId);
      ok(res, quotation, 'Quotation submitted');
    } catch (error) { next(error); }
  },

  async findByRfq(req: Request, res: Response, next: NextFunction) {
    try {
      const quotations = await quotationService.findByRfq(req.params.rfqId!);
      ok(res, quotations);
    } catch (error) { next(error); }
  },

  async compare(req: Request, res: Response, next: NextFunction) {
    try {
      const comparison = await quotationService.compare(req.params.rfqId!);
      ok(res, comparison);
    } catch (error) { next(error); }
  },

  async select(req: Request, res: Response, next: NextFunction) {
    try {
      const quotation = await quotationService.select(req.params.id!, req.user!.userId);
      ok(res, quotation, 'Quotation selected');
    } catch (error) { next(error); }
  },
};
