import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { aiService } from './ai.service';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { AiChatSchema } from '@vendorbridge/shared';
import { ok } from '../../lib/response';

export const aiRoutes = Router();

aiRoutes.use(authenticate);

aiRoutes.post('/chat', validate(AiChatSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await aiService.chat(req.user!.userId, req.user!.role, req.body.messages);
    ok(res, result);
  } catch (error) {
    next(error);
  }
});
