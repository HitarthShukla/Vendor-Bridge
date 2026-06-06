import { Prisma } from '@prisma/client';
import { prisma } from './db';

/**
 * Generate auto-incrementing, human-readable document IDs.
 *
 * Format: PREFIX-YYYY-NNNN
 * Examples: RFQ-2025-0042, PO-2025-0007, INV-2025-0103
 */
export async function generateDocumentId(
  prefix: string,
  table: string
): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) FROM ${Prisma.raw(table)}
    WHERE EXTRACT(YEAR FROM created_at) = ${year}
  `;
  const sequence = String(Number(count[0]?.count ?? 0) + 1).padStart(4, '0');
  return `${prefix}-${year}-${sequence}`;
}
