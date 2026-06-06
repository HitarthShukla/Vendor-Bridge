# VendorBridge

> Procurement & Vendor Management ERP — Hackathon Project

VendorBridge is a full-stack ERP platform that digitizes and centralizes procurement workflows. It covers everything from vendor onboarding and RFQ creation through quotation comparison, approval workflows, purchase order generation, and invoice delivery — with real-time updates, an AI assistant, and blockchain-anchored audit trails.

---

## Features

- **Vendor Management** — Register vendors with GST details, categories, contact info, and status tracking
- **RFQ Creation** — Create requests for quotation with line items, deadlines, attachments, and vendor assignments
- **Quotation Submission** — Vendors submit itemized quotes with pricing, delivery timelines, and terms
- **Quotation Comparison** — Side-by-side comparison with lowest price highlighting and delivery timeline analysis
- **Approval Workflow** — Structured approve/reject flow with remarks, timeline tracking, and real-time alerts
- **Purchase Orders** — Auto-generated POs from approved quotations with blockchain hash anchoring
- **Invoice Generation** — PDF invoice generation, email delivery, print support
- **AI Assistant** — Claude-powered procurement chatbot with live DB context
- **Real-time Dashboard** — Socket.IO powered live stats, notifications, and approval alerts
- **Blockchain Audit** — Immutable PO/invoice hash records on Polygon Mumbai testnet
- **Activity Logs** — Full audit trail of every procurement action
- **Reports & Analytics** — Spend summaries, vendor performance, monthly trends

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS v3 + shadcn/ui |
| Server state | TanStack Query v5 |
| Client state | Zustand |
| Forms | React Hook Form + Zod |
| Routing | React Router v6 |
| Backend | Node.js 20 + Express + TypeScript |
| ORM | Prisma ORM |
| Database | PostgreSQL 16 |
| Cache / Queue | Redis + Bull |
| Real-time | Socket.IO |
| Auth | JWT (access 15m) + Refresh tokens (7d, DB-stored) |
| PDF | Puppeteer (server) + @react-pdf/renderer (client preview) |
| AI | Anthropic Claude API (claude-haiku) |
| Blockchain | Solidity + Hardhat → Polygon Mumbai |
| Email | Nodemailer + SMTP |
| Testing | Vitest + Supertest + React Testing Library |
| CI | GitHub Actions |

---

## User Roles

| Role | Permissions |
|---|---|
| **Admin** | Manage users, manage vendors, view all analytics |
| **Procurement Officer** | Create RFQs, compare quotations, generate POs and invoices |
| **Manager / Approver** | Approve or reject procurement requests, monitor workflows |
| **Vendor** | Submit quotations, track RFQ status, view purchase orders |

---

## Project Structure

```
vendorbridge/
├── packages/
│   └── shared/               # Shared Zod schemas + TypeScript types
│
├── apps/
│   ├── server/               # Express API
│   │   ├── src/
│   │   │   ├── modules/      # Feature modules (auth, vendors, rfq, etc.)
│   │   │   ├── middleware/   # auth, rbac, validate, rate-limit, error
│   │   │   ├── lib/          # db, redis, socket, mailer, queue, blockchain
│   │   │   └── jobs/         # Bull processors (pdf, email, blockchain)
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── migrations/
│   │
│   └── client/               # React SPA
│       └── src/
│           ├── components/   # ui/ (shadcn) + shared/ (cross-feature)
│           ├── features/     # Feature modules (vendors, rfq, invoices, etc.)
│           ├── hooks/        # useAuth, useSocket, useRealtime
│           ├── layouts/      # AppLayout, AuthLayout, VendorLayout
│           ├── lib/          # apiClient, queryClient, socketClient
│           ├── routes/       # Route definitions + role guards
│           └── store/        # Zustand stores
│
├── docker-compose.yml
└── README.md
```

Each backend module follows the same pattern:

```
modules/vendors/
├── vendors.controller.ts   # Route handlers only — no logic
├── vendors.service.ts      # All business logic
├── vendors.routes.ts       # Express router
├── vendors.schema.ts       # Zod validation schemas
└── vendors.types.ts        # Module-specific types
```

---

## Prerequisites

- Node.js 20 LTS
- Docker + Docker Compose (for PostgreSQL and Redis)
- Git

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-org/vendorbridge.git
cd vendorbridge
```

### 2. Install dependencies

```bash
npm install
```

This installs dependencies for all packages in the monorepo (`packages/shared`, `apps/server`, `apps/client`).

### 3. Start the database and Redis

```bash
docker-compose up -d
```

This starts PostgreSQL on `localhost:5432` and Redis on `localhost:6379`.

### 4. Configure environment variables

```bash
cp apps/server/.env.example apps/server/.env
cp apps/client/.env.example apps/client/.env
```

Edit `apps/server/.env`:

```env
PORT=4000
DATABASE_URL=postgresql://vendorbridge:vendorbridge@localhost:5432/vendorbridge
REDIS_URL=redis://localhost:6379

JWT_SECRET=your-256-bit-secret-here
JWT_REFRESH_SECRET=your-256-bit-refresh-secret-here
JWT_EXPIRES_IN=15m
REFRESH_EXPIRES_IN=7d

ANTHROPIC_API_KEY=your-anthropic-api-key

BLOCKCHAIN_RPC_URL=https://rpc-mumbai.maticvigil.com
BLOCKCHAIN_PRIVATE_KEY=your-funded-wallet-private-key
CONTRACT_ADDRESS=your-deployed-contract-address

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@vendorbridge.com

CLIENT_URL=http://localhost:5173
```

Edit `apps/client/.env`:

```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```

### 5. Run database migrations and seed

```bash
cd apps/server
npx prisma migrate dev
npx prisma db seed
```

The seed script creates:
- 1 Admin user
- 2 Procurement Officers
- 1 Manager
- 3 Vendor users with vendor profiles
- Sample RFQs, quotations, and purchase orders

### 6. Start the development servers

From the root:

```bash
npm run dev
```

This starts both the API server (`localhost:4000`) and the React client (`localhost:5173`) concurrently.

---

## Default Seed Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@vendorbridge.com | Admin@1234 |
| Procurement Officer | officer@vendorbridge.com | Officer@1234 |
| Manager | manager@vendorbridge.com | Manager@1234 |
| Vendor | vendor1@acme.com | Vendor@1234 |

---

## Available Scripts

From the repo root:

```bash
npm run dev          # Start both server and client in watch mode
npm run build        # Build both apps for production
npm run lint         # ESLint across all packages
npm run typecheck    # TypeScript check across all packages
npm run test         # Run all tests (Vitest + Supertest)
npm run test:watch   # Tests in watch mode
```

From `apps/server`:

```bash
npx prisma studio          # Open Prisma DB browser at localhost:5555
npx prisma migrate dev     # Create and apply a new migration
npx prisma migrate reset   # Reset DB and re-run all migrations + seed
npx prisma generate        # Regenerate Prisma client after schema changes
```

---

## API Overview

All responses follow a consistent envelope:

```json
{ "success": true, "data": { ... }, "message": "Optional message" }
```

```json
{ "success": false, "error": { "code": "VENDOR_NOT_FOUND", "message": "..." } }
```

Key endpoints:

```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/refresh
POST   /api/auth/logout

GET    /api/vendors
POST   /api/vendors
GET    /api/vendors/:id
PATCH  /api/vendors/:id

GET    /api/rfqs
POST   /api/rfqs
GET    /api/rfqs/:id
PATCH  /api/rfqs/:id/publish
GET    /api/rfqs/:id/quotations

POST   /api/quotations
PATCH  /api/quotations/:id/submit
GET    /api/quotations/compare/:rfqId

PATCH  /api/approvals/:id/approve
PATCH  /api/approvals/:id/reject

GET    /api/purchase-orders
POST   /api/purchase-orders
GET    /api/purchase-orders/:id

GET    /api/invoices
POST   /api/invoices/:poId/generate
POST   /api/invoices/:id/send-email
GET    /api/invoices/:id/pdf

POST   /api/ai/chat

GET    /api/reports/dashboard
GET    /api/reports/spend-summary
GET    /api/reports/vendor-performance
```

Full API documentation is available in the Postman collection at `/docs/VendorBridge.postman_collection.json`.

---

## Real-Time Events (Socket.IO)

Connect with a valid JWT:

```javascript
const socket = io('http://localhost:4000', {
  auth: { token: accessToken }
});
```

Key events:

```
notification:new       → Personal notification for the connected user
rfq:updated            → RFQ status changed
quotation:received     → New quotation submitted (Procurement Officers)
approval:decided       → Approval approved or rejected
dashboard:stats        → Live dashboard stat refresh
```

---

## Blockchain Audit

Purchase Orders and Invoices are anchored to the Polygon Mumbai testnet on finalization. A SHA-256 hash of the document content is written to the `AuditTrail` smart contract. The transaction hash is stored in `blockchain_tx` and visible in the UI as a "Blockchain Verified" badge linking to Polygonscan.

To deploy the contract locally:

```bash
cd apps/server
npx hardhat compile
npx hardhat run scripts/deploy.js --network mumbai
```

Copy the deployed contract address into your `.env` as `CONTRACT_ADDRESS`.

---

## Git Workflow

Branch naming:

```
feature/42-rfq-deadline-picker
fix/87-quotation-total-calc
chore/upgrade-prisma-5
```

Commit format (Conventional Commits):

```
feat(rfq): add deadline picker with vendor assignment
fix(quotations): correct tax calculation on multi-item quotes
chore(db): add index on activity_logs.created_at
```

PRs require at least 1 approval and a passing CI pipeline before merge. No direct pushes to `main`.

---

## Contributing

1. Pick an issue from the GitHub board
2. Branch from `develop`: `git checkout -b feature/[issue-number]-description`
3. Write code following the patterns in `CONTRIBUTING.md`
4. Open a PR against `develop` with a clear description
5. Address review comments, get 1 approval, merge

See `CONTRIBUTING.md` for the full coding standards, naming conventions, and definition of done.

---

## License

MIT — see `LICENSE` for details.
