import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { fail } from '../lib/response';

/**
 * Zod validation middleware.
 * Validates req.body against the provided schema.
 * Replaces req.body with the parsed (cleaned) data on success.
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.flatten();
      fail(res, 400, 'VALIDATION_ERROR', JSON.stringify(errors.fieldErrors));
      return;
    }

    req.body = result.data;
    next();
  };
};

/**
 * Validate query parameters.
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = result.error.flatten();
      fail(res, 400, 'VALIDATION_ERROR', JSON.stringify(errors.fieldErrors));
      return;
    }

    req.query = result.data;
    next();
  };
};
