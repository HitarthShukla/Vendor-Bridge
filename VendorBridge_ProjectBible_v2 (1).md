# VendorBridge — Project Bible v2.0

> **For all contributors. Read completely before writing a single line of code.**
> Version: 2.0 | Evaluation focus: DB design · Modular architecture · Coding patterns · Security · Performance

---

## Part 1 — Stack & Architecture

### Why this stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend framework | React 18 + Vite + TypeScript | Component reuse, fast dev server, full type safety |
| Styling | Tailwind CSS v3 | Utility-first, zero runtime overhead, consistent spacing system |
| UI components | shadcn/ui (Radix UI primitives) | Accessible, unstyled base — styled with Tailwind on top |
| State (server) | TanStack Query v5 | Caching, loading/error/refetch, deduplication |
| State (client) | Zustand | Minimal boilerplate for UI state (sidebar, modals, notifications) |
| Forms | React Hook Form + Zod | Zod schema is the single source of truth for validation |
| Routing | React Router v6 | Nested routes, data loaders, role guards |
| Real-time | Socket.IO (client) | Live dashboard updates, notification feed, approval alerts |
| PDF | react-pdf / @react-pdf/renderer | Client-side invoice preview; server generates final PDF |
| Charts | Recharts | Procurement analytics, spend trends |
| Tables | TanStack Table v8 | Virtualized, sortable, filterable data grids |
| Icons | Lucide React | Consistent, tree-shakeable icon set |
| Backend runtime | Node.js 20 LTS + Express | Mature, easy to structure modularly |
| Backend language | TypeScript | Shared types with frontend, catches bugs at compile time |
| ORM | Prisma ORM | Type-safe queries, schema-first, migrations as code |
| Database | PostgreSQL 16 | Relational integrity, JSON columns, full-text search, triggers |
| Real-time | Socket.IO (server) | Namespaced events per role, room-based broadcasting |
| Validation | Zod (shared package) | One schema validates HTTP body, DB input, and frontend forms |
| Auth | JWT access token (15m) + refresh token (7d, DB-stored) | Stateless auth with rotation and revocation |
| AI chatbot | Anthropic Claude API (claude-haiku) | Procurement assistant — one focused use case |
| Blockchain audit | Ethereum (local Hardhat + deployed to Polygon Mumbai) | Immutable PO/invoice hash anchoring — no token economy |
| Email | Nodemailer + SMTP (self-hosted or Gmail relay) | Invoice delivery — no paid service dependency |
| File storage | Local disk (dev) → server/uploads folder | Attachments; no cloud dependency required |
| PDF gen (server) | Puppeteer | Headless browser renders invoice HTML → PDF |
| Queue/jobs | Bull + Redis | Background: PDF generation, email dispatch, blockchain tx |
| Cache | Redis | Session store, rate limit counters, real-time presence |
| Testing | Vitest + Supertest + React Testing Library | Unit + integration + component |
| CI | GitHub Actions | Lint, typecheck, test on every PR |
| Dev DB | Docker Compose | PostgreSQL + Redis spun up with one command |

---

## Part 2 — Repository Structure

```
vendorbridge/
├── packages/
│   └── shared/                    # Shared Zod schemas + TypeScript types
│       ├── src/
│       │   ├── schemas/           # All Zod schemas (vendor, rfq, quotation, etc.)
│       │   └── types/             # Derived TS types from schemas
│       └── package.json
│
├── apps/
│   ├── server/                    # Express API
│   │   ├── src/
│   │   │   ├── modules/           # Feature modules (see §3)
│   │   │   ├── middleware/        # auth, rbac, error, rate-limit, validate
│   │   │   ├── lib/               # db (prisma), redis, socket, mailer, queue, blockchain
│   │   │   ├── jobs/              # Bull job processors (pdf, email, blockchain)
│   │   │   └── app.ts             # Express app factory
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── tsconfig.json
│   │
│   └── client/                    # React SPA
│       ├── src/
│       │   ├── components/
│       │   │   ├── ui/            # shadcn/ui base components
│       │   │   └── shared/        # Cross-feature components (StatusBadge, DataTable, etc.)
│       │   ├── features/          # Feature modules (see §3)
│       │   ├── hooks/             # Global hooks (useAuth, useSocket, useRealtime)
│       │   ├── layouts/           # AppLayout, AuthLayout, VendorLayout
│       │   ├── lib/               # apiClient, queryClient, socketClient, utils
│       │   ├── routes/            # Route definitions + role guards
│       │   ├── store/             # Zustand stores
│       │   └── types/             # Client-only types
│       └── vite.config.ts
│
├── docker-compose.yml             # PostgreSQL + Redis for local dev
├── .github/workflows/ci.yml
└── README.md
```

---

## Part 3 — Module Architecture (Most Important)

Every feature is a self-contained module. Both frontend and backend follow the same module list.

### Backend module structure

```
modules/
├── auth/
│   ├── auth.controller.ts         # Route handlers only — no logic
│   ├── auth.service.ts            # All business logic
│   ├── auth.routes.ts             # Express router
│   ├── auth.schema.ts             # Zod schemas (LoginSchema, RegisterSchema)
│   └── auth.types.ts              # Module-specific types
│
├── vendors/
├── rfq/
├── quotations/
├── approvals/
├── purchase-orders/
├── invoices/
├── activity-logs/
├── reports/
├── ai-assistant/
└── blockchain/
```

**Rules for every module:**
- Controller receives `req`, calls `service`, returns response. No DB calls in controllers.
- Service contains all business logic. Calls Prisma — never raw SQL.
- Schema file exports Zod schemas used in both the middleware validation layer and the `packages/shared` package.
- No module imports internals of another module. Use the module's public service interface only.
- No circular dependencies between modules.

### Frontend module structure

```
features/
├── auth/
│   ├── api/                       # useQuery / useMutation hooks for this feature
│   ├── components/                # Feature-specific components
│   ├── hooks/                     # Feature-specific hooks
│   ├── types.ts
│   └── index.ts                   # Public barrel export
│
├── vendors/
├── rfq/
├── quotations/
├── approvals/
├── purchase-orders/
├── invoices/
├── activity-logs/
├── reports/
├── ai-assistant/
└── blockchain/
```

**Rule**: Never import `from '../../vendors/components/VendorRow'` inside the `rfq` feature. Import from `'@features/vendors'` (barrel). Eslint `import/no-internal-modules` enforces this.

---

## Part 4 — Database Design (Primary Evaluation Criterion)

### Design principles

- Every table has `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- Every table has `created_at TIMESTAMPTZ DEFAULT now()` and `updated_at TIMESTAMPTZ`
- `updated_at` is maintained by a reusable PostgreSQL trigger — not application code
- Soft deletes via `deleted_at TIMESTAMPTZ NULL` on all core entities (vendors, RFQs, POs, invoices)
- Status columns use PostgreSQL `ENUM` types — not raw strings
- All foreign keys have explicit `ON DELETE` behavior defined (never implicit)
- Indexes on every FK column and every column used in `WHERE` or `ORDER BY`
- JSON columns (`JSONB`) used for flexible but queryable data (item line details, metadata)
- All monetary values stored as `NUMERIC(15, 2)` — never `FLOAT`
- Audit trail via `activity_logs` table — every state change recorded

### Complete Prisma schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ────────────────────────────────────────────────────────────────────

enum UserRole {
  ADMIN
  PROCUREMENT_OFFICER
  MANAGER
  VENDOR
}

enum VendorStatus {
  ACTIVE
  INACTIVE
  BLACKLISTED
  PENDING_VERIFICATION
}

enum RfqStatus {
  DRAFT
  PUBLISHED
  CLOSED
  CANCELLED
}

enum QuotationStatus {
  DRAFT
  SUBMITTED
  UNDER_REVIEW
  SELECTED
  REJECTED
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  ESCALATED
}

enum PurchaseOrderStatus {
  DRAFT
  CONFIRMED
  PARTIALLY_DELIVERED
  DELIVERED
  CANCELLED
}

enum InvoiceStatus {
  GENERATED
  SENT
  PAID
  OVERDUE
  CANCELLED
}

enum ActivityAction {
  CREATED
  UPDATED
  DELETED
  STATUS_CHANGED
  APPROVED
  REJECTED
  SENT
  DOWNLOADED
  VIEWED
}

// ─── Users ────────────────────────────────────────────────────────────────────

model User {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email        String   @unique
  password     String
  name         String
  role         UserRole
  is_active    Boolean  @default(true)
  avatar_url   String?
  created_at   DateTime @default(now()) @db.Timestamptz
  updated_at   DateTime @updatedAt @db.Timestamptz
  deleted_at   DateTime? @db.Timestamptz

  refresh_tokens RefreshToken[]
  rfqs_created   Rfq[]           @relation("CreatedBy")
  approvals      Approval[]
  activity_logs  ActivityLog[]
  vendor_profile Vendor?

  @@index([email])
  @@index([role])
  @@map("users")
}

model RefreshToken {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  token      String   @unique
  user_id    String   @db.Uuid
  expires_at DateTime @db.Timestamptz
  revoked_at DateTime? @db.Timestamptz
  created_at DateTime @default(now()) @db.Timestamptz

  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([user_id])
  @@map("refresh_tokens")
}

// ─── Vendors ──────────────────────────────────────────────────────────────────

model Vendor {
  id              String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id         String?      @unique @db.Uuid
  name            String
  company_name    String
  email           String       @unique
  phone           String
  gst_number      String       @unique
  pan_number      String?
  category        String
  address         Json
  bank_details    Json?
  status          VendorStatus @default(PENDING_VERIFICATION)
  rating          Decimal      @default(0) @db.Decimal(3, 2)
  total_orders    Int          @default(0)
  notes           String?
  created_at      DateTime     @default(now()) @db.Timestamptz
  updated_at      DateTime     @updatedAt @db.Timestamptz
  deleted_at      DateTime?    @db.Timestamptz

  user             User?         @relation(fields: [user_id], references: [id], onDelete: SetNull)
  rfq_assignments  RfqVendor[]
  quotations       Quotation[]
  purchase_orders  PurchaseOrder[]
  invoices         Invoice[]

  @@index([status])
  @@index([category])
  @@index([gst_number])
  @@map("vendors")
}

// ─── RFQ (Request for Quotation) ──────────────────────────────────────────────

model Rfq {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  rfq_number   String    @unique
  title        String
  description  String?
  status       RfqStatus @default(DRAFT)
  deadline     DateTime  @db.Timestamptz
  created_by   String    @db.Uuid
  created_at   DateTime  @default(now()) @db.Timestamptz
  updated_at   DateTime  @updatedAt @db.Timestamptz
  deleted_at   DateTime? @db.Timestamptz

  creator      User          @relation("CreatedBy", fields: [created_by], references: [id])
  items        RfqItem[]
  vendors      RfqVendor[]
  quotations   Quotation[]
  attachments  Attachment[]

  @@index([status])
  @@index([created_by])
  @@index([deadline])
  @@map("rfqs")
}

model RfqItem {
  id          String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  rfq_id      String  @db.Uuid
  name        String
  description String?
  quantity    Decimal @db.Decimal(15, 3)
  unit        String
  category    String?

  rfq              Rfq                @relation(fields: [rfq_id], references: [id], onDelete: Cascade)
  quotation_items  QuotationItem[]

  @@index([rfq_id])
  @@map("rfq_items")
}

model RfqVendor {
  rfq_id      String   @db.Uuid
  vendor_id   String   @db.Uuid
  invited_at  DateTime @default(now()) @db.Timestamptz
  viewed_at   DateTime? @db.Timestamptz

  rfq    Rfq    @relation(fields: [rfq_id], references: [id], onDelete: Cascade)
  vendor Vendor @relation(fields: [vendor_id], references: [id], onDelete: Cascade)

  @@id([rfq_id, vendor_id])
  @@map("rfq_vendors")
}

// ─── Quotations ───────────────────────────────────────────────────────────────

model Quotation {
  id              String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  quotation_number String         @unique
  rfq_id          String          @db.Uuid
  vendor_id       String          @db.Uuid
  status          QuotationStatus @default(DRAFT)
  total_amount    Decimal         @db.Decimal(15, 2)
  currency        String          @default("INR")
  delivery_days   Int
  validity_days   Int
  notes           String?
  submitted_at    DateTime?       @db.Timestamptz
  created_at      DateTime        @default(now()) @db.Timestamptz
  updated_at      DateTime        @updatedAt @db.Timestamptz

  rfq      Rfq             @relation(fields: [rfq_id], references: [id])
  vendor   Vendor          @relation(fields: [vendor_id], references: [id])
  items    QuotationItem[]
  approval Approval?

  @@unique([rfq_id, vendor_id])
  @@index([rfq_id])
  @@index([vendor_id])
  @@index([status])
  @@map("quotations")
}

model QuotationItem {
  id             String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  quotation_id   String  @db.Uuid
  rfq_item_id    String  @db.Uuid
  unit_price     Decimal @db.Decimal(15, 2)
  quantity       Decimal @db.Decimal(15, 3)
  tax_percent    Decimal @db.Decimal(5, 2) @default(18)
  total_price    Decimal @db.Decimal(15, 2)
  notes          String?

  quotation Quotation @relation(fields: [quotation_id], references: [id], onDelete: Cascade)
  rfq_item  RfqItem   @relation(fields: [rfq_item_id], references: [id])

  @@index([quotation_id])
  @@map("quotation_items")
}

// ─── Approvals ────────────────────────────────────────────────────────────────

model Approval {
  id            String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  quotation_id  String         @unique @db.Uuid
  approver_id   String         @db.Uuid
  status        ApprovalStatus @default(PENDING)
  remarks       String?
  decided_at    DateTime?      @db.Timestamptz
  created_at    DateTime       @default(now()) @db.Timestamptz
  updated_at    DateTime       @updatedAt @db.Timestamptz

  quotation Quotation @relation(fields: [quotation_id], references: [id])
  approver  User      @relation(fields: [approver_id], references: [id])

  @@index([approver_id])
  @@index([status])
  @@map("approvals")
}

// ─── Purchase Orders ──────────────────────────────────────────────────────────

model PurchaseOrder {
  id             String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  po_number      String              @unique
  quotation_id   String              @unique @db.Uuid
  vendor_id      String              @db.Uuid
  status         PurchaseOrderStatus @default(DRAFT)
  subtotal       Decimal             @db.Decimal(15, 2)
  tax_total      Decimal             @db.Decimal(15, 2)
  grand_total    Decimal             @db.Decimal(15, 2)
  delivery_date  DateTime?           @db.Timestamptz
  terms          String?
  blockchain_tx  String?
  blockchain_hash String?
  created_at     DateTime            @default(now()) @db.Timestamptz
  updated_at     DateTime            @updatedAt @db.Timestamptz
  deleted_at     DateTime?           @db.Timestamptz

  vendor    Vendor    @relation(fields: [vendor_id], references: [id])
  invoices  Invoice[]

  @@index([vendor_id])
  @@index([status])
  @@map("purchase_orders")
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

model Invoice {
  id              String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  invoice_number  String        @unique
  purchase_order_id String      @db.Uuid
  vendor_id       String        @db.Uuid
  status          InvoiceStatus @default(GENERATED)
  subtotal        Decimal       @db.Decimal(15, 2)
  tax_total       Decimal       @db.Decimal(15, 2)
  grand_total     Decimal       @db.Decimal(15, 2)
  due_date        DateTime      @db.Timestamptz
  paid_at         DateTime?     @db.Timestamptz
  pdf_url         String?
  email_sent_at   DateTime?     @db.Timestamptz
  blockchain_hash String?
  created_at      DateTime      @default(now()) @db.Timestamptz
  updated_at      DateTime      @updatedAt @db.Timestamptz
  deleted_at      DateTime?     @db.Timestamptz

  purchase_order PurchaseOrder @relation(fields: [purchase_order_id], references: [id])
  vendor         Vendor        @relation(fields: [vendor_id], references: [id])

  @@index([purchase_order_id])
  @@index([vendor_id])
  @@index([status])
  @@index([due_date])
  @@map("invoices")
}

// ─── Attachments ──────────────────────────────────────────────────────────────

model Attachment {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  rfq_id       String?  @db.Uuid
  file_name    String
  file_path    String
  file_size    Int
  mime_type    String
  uploaded_by  String   @db.Uuid
  created_at   DateTime @default(now()) @db.Timestamptz

  rfq Rfq? @relation(fields: [rfq_id], references: [id], onDelete: SetNull)

  @@index([rfq_id])
  @@map("attachments")
}

// ─── Activity Logs ────────────────────────────────────────────────────────────

model ActivityLog {
  id           String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id      String?        @db.Uuid
  entity_type  String
  entity_id    String         @db.Uuid
  action       ActivityAction
  metadata     Json?
  ip_address   String?
  user_agent   String?
  created_at   DateTime       @default(now()) @db.Timestamptz

  user User? @relation(fields: [user_id], references: [id], onDelete: SetNull)

  @@index([entity_type, entity_id])
  @@index([user_id])
  @@index([created_at])
  @@map("activity_logs")
}

// ─── Notifications ────────────────────────────────────────────────────────────

model Notification {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id    String   @db.Uuid
  title      String
  message    String
  type       String
  entity_id  String?  @db.Uuid
  is_read    Boolean  @default(false)
  created_at DateTime @default(now()) @db.Timestamptz

  @@index([user_id, is_read])
  @@index([created_at])
  @@map("notifications")
}
```

### PostgreSQL trigger for `updated_at`

This migration runs once and applies to all tables — no application-level timestamp management:

```sql
-- prisma/migrations/0001_updated_at_trigger/migration.sql

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables that have updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','vendors','rfqs','quotations',
    'approvals','purchase_orders','invoices'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()', t
    );
  END LOOP;
END;
$$;
```

---

## Part 5 — Real-Time Architecture (Socket.IO)

### Event namespaces

```
/procurement   → Procurement Officers + Managers
/vendor        → Vendor users
/admin         → Admin users
```

### Room strategy

```
room: user:{userId}         → Personal notifications
room: rfq:{rfqId}           → Anyone watching a specific RFQ
room: org:procurement       → All procurement officers
room: approver:{userId}     → Approval queue updates for a manager
```

### Events emitted by server

```typescript
// On approval received
io.to(`user:${vendorUserId}`).emit('notification:new', { ... });
io.to('org:procurement').emit('approval:decided', { quotationId, status });

// On RFQ status change
io.to(`rfq:${rfqId}`).emit('rfq:updated', { rfqId, status });

// On new quotation submitted
io.to('org:procurement').emit('quotation:received', { rfqId, vendorName });

// Dashboard stat refresh
io.to('org:procurement').emit('dashboard:stats', { pendingApprovals, activeRfqs });
```

### Frontend socket hook

```typescript
// hooks/useSocket.ts
export function useRealtimeEvent<T>(event: string, handler: (data: T) => void) {
  const socket = useSocketStore(s => s.socket);
  useEffect(() => {
    socket?.on(event, handler);
    return () => { socket?.off(event, handler); };
  }, [socket, event, handler]);
}
```

---

## Part 6 — AI Assistant (Chatbot)

**What it does**: A scoped procurement assistant answering questions about the user's own data.

**How it's implemented**: The backend fetches relevant context from the DB, injects it into the system prompt, then calls the Claude API. No raw AI call from the frontend — all AI traffic goes through our own API so we control context, rate limits, and logging.

```typescript
// modules/ai-assistant/ai-assistant.service.ts

async function getProcurementContext(userId: string, role: UserRole) {
  const [pendingApprovals, activeRfqs, recentOrders] = await Promise.all([
    prisma.approval.count({ where: { status: 'PENDING', approver_id: userId } }),
    prisma.rfq.count({ where: { status: 'PUBLISHED' } }),
    prisma.purchaseOrder.findMany({ take: 5, orderBy: { created_at: 'desc' } }),
  ]);
  return { pendingApprovals, activeRfqs, recentOrders };
}

async function chat(userId: string, role: UserRole, messages: ChatMessage[]) {
  const context = await getProcurementContext(userId, role);
  const systemPrompt = buildSystemPrompt(role, context);
  
  const response = await anthropic.messages.create({
    model: 'claude-haiku-20240307',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });
  
  await logActivity(userId, 'AI_ASSISTANT', 'QUERY', { messageCount: messages.length });
  return response.content[0].text;
}
```

**Rate limit**: 20 requests per user per hour, enforced via Redis counter.

---

## Part 7 — Blockchain Audit Trail

**What it does**: When a Purchase Order or Invoice is finalized, a SHA-256 hash of its content is written to a smart contract on Polygon Mumbai testnet. This creates an immutable, tamper-evident audit record.

**Why this is real**: We're not simulating it. The Hardhat smart contract is deployed once. The backend uses `ethers.js` to call `recordDocument(hash)` via a funded wallet. The returned transaction hash is stored in the `blockchain_tx` column.

```solidity
// contracts/AuditTrail.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract AuditTrail {
    mapping(bytes32 => uint256) public documentTimestamps;
    event DocumentRecorded(bytes32 indexed hash, uint256 timestamp);

    function recordDocument(bytes32 documentHash) external {
        require(documentTimestamps[documentHash] == 0, "Already recorded");
        documentTimestamps[documentHash] = block.timestamp;
        emit DocumentRecorded(documentHash, block.timestamp);
    }

    function verifyDocument(bytes32 documentHash) external view returns (uint256) {
        return documentTimestamps[documentHash];
    }
}
```

```typescript
// lib/blockchain.ts
import { ethers } from 'ethers';
import crypto from 'crypto';

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY!, provider);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS!, ABI, wallet);

export async function anchorDocument(data: object): Promise<{ hash: string; tx: string }> {
  const hash = '0x' + crypto.createHash('sha256')
    .update(JSON.stringify(data)).digest('hex');
  const tx = await contract.recordDocument(hash);
  await tx.wait();
  return { hash, tx: tx.hash };
}
```

This runs as a background Bull job so it never blocks the HTTP response. The UI shows a "blockchain verified" badge with a link to the Polygonscan transaction when `blockchain_tx` is present.

---

## Part 8 — API Design Standards

### Response envelope (always consistent)

```typescript
// lib/response.ts
export const ok = <T>(res: Response, data: T, message?: string) =>
  res.status(200).json({ success: true, data, message });

export const created = <T>(res: Response, data: T) =>
  res.status(201).json({ success: true, data });

export const paginated = <T>(res: Response, data: T[], meta: PaginationMeta) =>
  res.status(200).json({ success: true, data, meta });

export const fail = (res: Response, status: number, code: string, message: string) =>
  res.status(status).json({ success: false, error: { code, message } });
```

### Validation middleware

```typescript
// middleware/validate.ts
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return fail(res, 400, 'VALIDATION_ERROR', result.error.flatten());
    }
    req.body = result.data;
    next();
  };
```

### RBAC middleware

```typescript
// middleware/rbac.ts
export const authorize = (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return fail(res, 403, 'FORBIDDEN', 'Insufficient permissions');
    }
    next();
  };

// Usage in routes:
router.post('/rfqs', authenticate, authorize('ADMIN', 'PROCUREMENT_OFFICER'), validate(CreateRfqSchema), rfqController.create);
```

---

## Part 9 — Document ID Generation

Auto-incrementing, human-readable IDs. Generated in the service layer before DB insert.

```typescript
// lib/documentId.ts
async function generateId(prefix: string, table: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) FROM ${Prisma.raw(table)} WHERE EXTRACT(YEAR FROM created_at) = ${year}
  `;
  const sequence = String(Number(count[0].count) + 1).padStart(4, '0');
  return `${prefix}-${year}-${sequence}`;
}

// Usage:
const rfqNumber = await generateId('RFQ', 'rfqs');      // RFQ-2025-0042
const poNumber  = await generateId('PO', 'purchase_orders');  // PO-2025-0007
const invNumber = await generateId('INV', 'invoices');   // INV-2025-0103
```

---

## Part 10 — Security Checklist

| Concern | Implementation |
|---|---|
| Password hashing | bcrypt, salt rounds = 12 |
| JWT secret | 256-bit random, from env only |
| Token rotation | Refresh token stored in DB; invalidated on use, revocable |
| Input validation | Zod on every POST/PUT/PATCH body before it reaches the service |
| SQL injection | Impossible — Prisma parameterizes all queries |
| File uploads | MIME type check + magic bytes check + rename on server + max 10MB |
| CORS | Whitelist only `VITE_CLIENT_URL` |
| Rate limiting | Redis-backed; 100 req/15min general, 10/min on auth endpoints |
| Helmet.js | HTTP security headers (CSP, HSTS, nosniff, etc.) |
| Sensitive data | GST, bank details never logged, never in error messages |
| Role enforcement | RBAC middleware on every protected route — frontend guards are UX only |
| XSS | React escapes by default; no `dangerouslySetInnerHTML` |
| Env secrets | Never committed; `.env.example` has all keys with placeholders |

---

## Part 11 — Git Workflow

### Branch naming

```
feature/[issue-number]-short-description    → feature/42-rfq-deadline-picker
fix/[issue-number]-short-description        → fix/87-quotation-total-calc
chore/description                           → chore/upgrade-prisma-5
docs/description                            → docs/blockchain-setup
```

### Commit messages (Conventional Commits, enforced by commitlint)

```
feat(rfq): add deadline picker with vendor assignment
fix(quotations): correct tax calculation on multi-item quotes
feat(blockchain): anchor PO hash on confirmation
chore(db): add index on activity_logs.created_at
test(auth): add refresh token rotation test
docs(setup): update Docker Compose instructions
```

Format: `type(scope): description` — lowercase, present tense, no period.

### PR rules

- Title follows commit format
- Description: what changed, why, how to test
- Link to GitHub issue
- At least 1 approval required
- CI must pass (lint + typecheck + tests)
- No PR larger than ~400 lines of diff (split into smaller PRs)
- No `console.log`, no `TODO`, no commented-out code in the diff

### Protected branches

- `main` — production-ready, no direct push
- `develop` — integration branch, PRs merge here first

---

## Part 12 — Design System

### Color tokens (Tailwind config)

```javascript
// tailwind.config.js
colors: {
  brand: {
    50:  '#EFF6FF',
    100: '#DBEAFE',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    900: '#1E3A8A',
  },
  success: { 50: '#F0FDF4', 500: '#22C55E', 700: '#15803D' },
  warning: { 50: '#FFFBEB', 500: '#F59E0B', 700: '#B45309' },
  danger:  { 50: '#FEF2F2', 500: '#EF4444', 700: '#B91C1C' },
  neutral: {
    50:  '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0',
    400: '#94A3B8', 600: '#475569', 700: '#334155',
    800: '#1E293B', 900: '#0F172A',
  },
}
```

### Status badge system (consistent everywhere)

| Status | Background | Text | Usage |
|---|---|---|---|
| `DRAFT` | neutral-100 | neutral-700 | RFQ, PO, Quotation |
| `PENDING` | warning-50 | warning-700 | Approvals |
| `PUBLISHED` / `ACTIVE` | brand-50 | brand-700 | RFQ, Vendor |
| `APPROVED` / `CONFIRMED` | success-50 | success-700 | Approvals, PO |
| `REJECTED` / `CANCELLED` | danger-50 | danger-700 | All |
| `SELECTED` / `PAID` | success-50 | success-800 | Quotations, Invoices |
| `OVERDUE` | danger-50 | danger-800 | Invoices |

### Typography scale

```
Page title:      text-2xl font-semibold tracking-tight
Section header:  text-lg font-medium
Card title:      text-base font-medium
Body:            text-sm text-neutral-700
Muted:           text-sm text-neutral-500
Label:           text-xs font-medium text-neutral-600 uppercase tracking-wide
Document ID:     font-mono text-xs text-neutral-500
```

### Spacing rules

- Page padding: `px-6 py-8` (desktop), `px-4 py-6` (mobile)
- Card padding: `p-6`
- Section gap: `space-y-6`
- Form field gap: `space-y-4`
- Grid gap (dashboard cards): `gap-4`
- Sidebar width: `w-64` (fixed)
- Content max-width: `max-w-7xl mx-auto`

### Loading / error / empty states (required for every list view)

```
Loading  → Skeleton rows matching the real content shape. No spinners.
Error    → Alert card with retry button. Show the error code.
Empty    → Illustration (SVG) + descriptive message + primary action CTA.
```

---

## Part 13 — Performance Rules

- All list endpoints support `page`, `limit`, `sort`, `order`, and feature-specific filters
- Default page size: 20. Maximum: 100.
- Database queries: never `SELECT *` — always specify columns
- N+1 prevention: always use Prisma `include` / `select` for relations, never loop-query
- Redis cache on: dashboard stats (30s TTL), vendor list (60s TTL), report aggregations (5min TTL)
- Client-side: TanStack Query handles caching — no redundant fetches
- Images: lazy-load all, serve WebP where possible
- Bundle: route-based code splitting via React Router `lazy()`

---

## Part 14 — Definition of Done

A feature is done only when all of these are true:

- [ ] TypeScript compiles with zero errors
- [ ] ESLint passes with zero errors or warnings
- [ ] All Zod schemas validated server-side (no unvalidated input reaches DB)
- [ ] RBAC enforced: frontend guard + backend middleware
- [ ] Loading, error, and empty states implemented
- [ ] API response matches the standard envelope
- [ ] Real-time event emitted where applicable (dashboard, notifications)
- [ ] Activity log entry created for every state change
- [ ] PR reviewed and approved by at least one team member
- [ ] No `console.log`, no `TODO`, no commented-out code in diff

---

*VendorBridge Project Bible v2.0 — June 2025*
