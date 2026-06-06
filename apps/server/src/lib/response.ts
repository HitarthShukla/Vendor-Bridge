import { Response } from 'express';
import type { PaginationMeta } from '@vendorbridge/shared';

/**
 * Standard API response envelope.
 * Every endpoint uses these helpers — never construct JSON manually.
 */

export const ok = <T>(res: Response, data: T, message?: string) =>
  res.status(200).json({ success: true, data, message });

export const created = <T>(res: Response, data: T, message?: string) =>
  res.status(201).json({ success: true, data, message });

export const paginated = <T>(res: Response, data: T[], meta: PaginationMeta) =>
  res.status(200).json({ success: true, data, meta });

export const noContent = (res: Response) =>
  res.status(204).send();

export const fail = (res: Response, status: number, code: string, message: string) =>
  res.status(status).json({ success: false, error: { code, message } });

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
