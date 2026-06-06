import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Zod validation middleware.
 * Validates req.body against the provided schema.
 * Replaces req.body with the parsed (cleaned) data on success.
 * Returns structured field-level errors on failure.
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const flattened = result.error.flatten();
      // Build a human-readable summary of what failed
      const fieldMessages: string[] = [];
      for (const [field, messages] of Object.entries(flattened.fieldErrors)) {
        fieldMessages.push(`${field}: ${(messages as string[]).join(', ')}`);
      }
      const summary = fieldMessages.length > 0
        ? `Validation failed — ${fieldMessages.join('; ')}`
        : 'Validation failed. Please check your inputs.';

      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: summary,
          fieldErrors: flattened.fieldErrors,
        },
      });
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
      const flattened = result.error.flatten();
      const fieldMessages: string[] = [];
      for (const [field, messages] of Object.entries(flattened.fieldErrors)) {
        fieldMessages.push(`${field}: ${(messages as string[]).join(', ')}`);
      }

      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: fieldMessages.join('; ') || 'Invalid query parameters.',
          fieldErrors: flattened.fieldErrors,
        },
      });
      return;
    }

    req.query = result.data;
    next();
  };
};
