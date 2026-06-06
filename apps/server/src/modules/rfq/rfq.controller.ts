import { Request, Response, NextFunction } from 'express';
import { rfqService } from './rfq.service';
import { ok, created, paginated } from '../../lib/response';

export const rfqController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const rfq = await rfqService.create(req.body, req.user!.userId);
      created(res, rfq, 'RFQ created successfully');
    } catch (error) { next(error); }
  },

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { rfqs, meta } = await rfqService.findAll(req.query as any);
      paginated(res, rfqs, meta);
    } catch (error) { next(error); }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const rfq = await rfqService.findById(req.params.id!);
      ok(res, rfq);
    } catch (error) { next(error); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const rfq = await rfqService.update(req.params.id!, req.body, req.user!.userId);
      ok(res, rfq, 'RFQ updated');
    } catch (error) { next(error); }
  },

  async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const rfq = await rfqService.publish(req.params.id!, req.user!.userId);
      ok(res, rfq, 'RFQ published successfully');
    } catch (error) { next(error); }
  },

  async close(req: Request, res: Response, next: NextFunction) {
    try {
      const rfq = await rfqService.close(req.params.id!, req.user!.userId);
      ok(res, rfq, 'RFQ closed');
    } catch (error) { next(error); }
  },
};
