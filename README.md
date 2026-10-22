# ReturnDesk — Support Returns Management System

> A robust, full-stack returns desk application built with **Next.js (App Router), TypeScript, Tailwind CSS, PostgreSQL, and Prisma ORM**. Centralized business rules, atomic reference generation, and database-level constraints guarantee strict compliance with e-commerce return workflows.

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Project Structure](#project-structure)
6. [Database Design](#database-design)
7. [Business Rules](#business-rules)
8. [API Documentation](#api-documentation)
9. [Environment Variables](#environment-variables)
10. [Local Setup](#local-setup)
11. [PostgreSQL Setup](#postgresql-setup)
12. [Prisma Setup & Migrations](#prisma-setup--migrations)
13. [Seed Data](#seed-data)
14. [Running the Application](#running-the-application)
15. [Automated Testing](#automated-testing)
16. [Design Decisions & Interview Rationale](#design-decisions--interview-rationale)
17. [Assumptions](#assumptions)
18. [Known Limitations & Future Scope](#known-limitations--future-scope)
19. [Time Spent](#time-spent)

---

## 🌟 Overview

**ReturnDesk** is a purpose-built returns management portal for support agents handling customer return requests for an online store.

It streamlines the lifecycle of return requests:

* Raising requests against orders
* Searching and filtering requests at scale
* Investigating return issues
* Adding immutable chronological notes
* Issuing resolutions:

  * Refund
  * Replacement
  * Store Credit
* Executing transitions through a deterministic state machine

Every business rule is enforced **strictly on the server side** in dedicated business logic modules. Even direct API calls that bypass the UI are fully validated and rejected with machine-readable errors and appropriate HTTP status codes.

---

## 🚀 Features

* **Automated Human-Readable Reference**
  Generates atomic, sequential references such as `RET-2026-00001` using database transactions.

* **Strict 5-State Lifecycle Engine**
  Enforces legal transitions:

  `OPEN → IN_REVIEW → APPROVED / REJECTED → COMPLETED`

* **Server-Side Query Engine**
  Supports multi-field search using `ILIKE` across customer, email, order, and reference fields, along with filtering, sorting, and pagination directly in PostgreSQL.

* **Search Debouncing**
  Uses a 350 ms frontend search debounce to prevent excessive API requests.

* **Conditional Resolution & Refund Validation**
  Requires a positive refund amount for `REFUND` and disallows refund amounts for `REPLACEMENT` and `STORE_CREDIT`.

* **Concurrency-Safe Duplicate Request Prevention**
  Prevents duplicate live requests for the same order and item until the previous request reaches a terminal state (`REJECTED` or `COMPLETED`).

* **Field Locking After Decision**
  Prevents editing customer and item details once a request is `APPROVED`, `REJECTED`, or `COMPLETED`.

* **Soft Deletion**
  Soft-deletes eligible requests (`OPEN` or `REJECTED`) while preserving the database audit trail.

* **Immutable Chronological Notes**
  Internal audit notes can be added at any point in the lifecycle but cannot be edited or deleted.

* **Fully Responsive UI**
  Includes status badges, modal dialogs, loading skeletons, error toasts, and mobile responsiveness down to 375 px.

## 🐳 Docker and AWS Deployment

The production image uses Next.js standalone output and runs as a non-root user. For local verification with PostgreSQL:

```bash
docker compose up --build
docker compose exec app npx prisma migrate deploy
```

The app is then available at `http://localhost:3000`. For AWS, push the image to Amazon ECR and run it on ECS Fargate or an EC2 host with Docker. Use Amazon RDS for PostgreSQL and set `DATABASE_URL` as a secret in the task definition or host environment. Run `npx prisma migrate deploy` as a release step before routing traffic to a new task.

---

## 🛠 Tech Stack

| Layer          | Technology                                       | Purpose                                               |
| -------------- | ------------------------------------------------ | ----------------------------------------------------- |
| **Frontend**   | React 19, Next.js 15, Tailwind CSS, Lucide Icons | Server-rendered UI and responsive styling             |
| **Backend**    | Next.js Route Handlers, Node.js                  | RESTful API endpoints                                 |
| **Validation** | Zod 3.24                                         | Request and query validation                          |
| **ORM**        | Prisma ORM 6.4                                   | Type-safe database queries and migrations             |
| **Database**   | PostgreSQL                                       | Relational database, transactions, enums, and indexes |
| **Testing**    | Node.js / `tsx`                                  | Automated business-rule testing                       |

---

## 🏗 Architecture

```text
┌───────────────────────────────────────────────────────┐
│                   ReturnDesk Frontend                 │
│          Next.js App Router + React + Tailwind        │
└──────────────────────────┬────────────────────────────┘
                           │
                           │ HTTP / JSON
                           ▼
┌───────────────────────────────────────────────────────┐
│                Next.js Route Handlers                 │
│              app/api/returns/...                      │
└──────────────────────────┬────────────────────────────┘
                           │
                           │ Zod Validation
                           ▼
┌───────────────────────────────────────────────────────┐
│             Centralized Business Rules                │
│   Lifecycle • Approval • Duplicates • Locking         │
│                    • Soft Removal                     │
└──────────────────────────┬────────────────────────────┘
                           │
                           │ Type-safe Queries
                           ▼
┌───────────────────────────────────────────────────────┐
│                     Prisma ORM                        │
└──────────────────────────┬────────────────────────────┘
                           │
                           │ SQL / Connection Pool
                           ▼
┌───────────────────────────────────────────────────────┐
│                 PostgreSQL Database                   │
│            Enums • Indexes • Tables                   │
└───────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```text
returndesk/
├── app/
│   ├── api/
│   │   └── returns/
│   │       ├── route.ts
│   │       └── [id]/
│   │           ├── route.ts
│   │           ├── status/
│   │           │   └── route.ts
│   │           └── notes/
│   │               └── route.ts
│   │
│   ├── returns/
│   │   ├── new/
│   │   │   └── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   │
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── returns/
│   │   ├── returns-table.tsx
│   │   ├── returns-filter-bar.tsx
│   │   ├── status-badge.tsx
│   │   ├── reason-badge.tsx
│   │   ├── resolution-badge.tsx
│   │   ├── approval-modal.tsx
│   │   ├── confirm-dialog.tsx
│   │   ├── edit-details-modal.tsx
│   │   └── notes-section.tsx
│   │
│   └── ui/
│       └── toast.tsx
│
├── lib/
│   ├── prisma.ts
│   ├── errors.ts
│   ├── reference.ts
│   ├── utils.ts
│   ├── validation/
│   │   └── returns.ts
│   └── business-rules/
│       ├── lifecycle.ts
│       ├── approval.ts
│       ├── duplicate.ts
│       ├── locking.ts
│       └── removal.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── tests/
│   └── business-rules.test.ts
│
├── public/
│
├── .env.example
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── package-lock.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 🗄 Database Design

### Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum ReturnReason {
  DAMAGED
  WRONG_ITEM
  SIZE_ISSUE
  NOT_AS_DESCRIBED
  CHANGED_MIND
}

enum ReturnStatus {
  OPEN
  IN_REVIEW
  APPROVED
  REJECTED
  COMPLETED
}

enum ReturnResolution {
  REFUND
  REPLACEMENT
  STORE_CREDIT
}

model ReturnRequest {
  id            String            @id @default(cuid())
  reference     String            @unique
  customerName  String
  customerEmail String
  customerPhone String
  orderId       String
  itemId        String
  quantity      Int
  reason        ReturnReason
  status        ReturnStatus      @default(OPEN)
  resolution    ReturnResolution?
  refundAmount  Decimal?          @db.Decimal(10, 2)
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
  removedAt     DateTime?

  notes Note[]

  @@index([status, removedAt])
  @@index([orderId, itemId])
  @@index([createdAt])
  @@index([customerEmail])
  @@index([customerName])
  @@index([reference])
  @@index([reason])
}

model Note {
  id        String        @id @default(cuid())
  requestId String
  request   ReturnRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  content   String        @db.Text
  createdAt DateTime      @default(now())

  @@index([requestId, createdAt])
}

model ReferenceSequence {
  year      Int @id
  lastValue Int @default(0)
}
```

### Database Constraints & Indexes

1. **Unique Reference**

   * `reference @unique` guarantees unique human-readable references.

2. **Status / Soft-Delete Index**

   * `[status, removedAt]` optimizes active request queries.

3. **Order / Item Index**

   * `[orderId, itemId]` speeds up duplicate-request checks.

4. **Foreign Key**

   * `Note.requestId → ReturnRequest.id` preserves relational integrity with cascade behavior.

5. **Atomic Reference Sequence**

   * `ReferenceSequence` uses an atomic increment inside a Prisma transaction to prevent duplicate references during concurrent requests.

---

## ⚖️ Business Rules

All five business rules are centralized inside `lib/business-rules/` and enforced by the API route handlers.

### Rule 1 — Status Lifecycle

Allowed transitions:

```text
OPEN
  │
  ▼
IN_REVIEW
  ├──► APPROVED ──► COMPLETED
  │
  └──► REJECTED
```

`REJECTED` and `COMPLETED` are terminal states.

Illegal transitions return `409 Conflict` with appropriate machine-readable error codes.

### Rule 2 — Approval Requires Resolution

A request cannot become `APPROVED` without a resolution.

For `REFUND`:

* `refundAmount` is required.
* `refundAmount` must be greater than `0`.

For `REPLACEMENT` or `STORE_CREDIT`:

* `refundAmount` must be `null` or omitted.

### Rule 3 — One Live Request Per Order / Item

A customer cannot have two live requests for the same order and item.

Live statuses:

```text
OPEN
IN_REVIEW
APPROVED
```

Closed statuses:

```text
REJECTED
COMPLETED
```

Once an existing request becomes `REJECTED` or `COMPLETED`, another request for the same order/item is permitted.

### Rule 4 — Locked Once Decided

After a request reaches:

```text
APPROVED
REJECTED
COMPLETED
```

the following fields become immutable:

```text
customerName
customerEmail
customerPhone
orderId
itemId
quantity
reason
```

Notes can still be added throughout the lifecycle.

### Rule 5 — Soft Deletion

Removing a request sets:

```text
removedAt = current timestamp
```

The physical database record is never deleted.

Only `OPEN` and `REJECTED` requests can be removed.

---

## 📡 API Documentation

### 1. List Return Requests

```http
GET /api/returns
```

Query parameters:

| Parameter | Description                                    |
| --------- | ---------------------------------------------- |
| `search`  | Search customer, email, order ID, or reference |
| `status`  | Filter by status                               |
| `reason`  | Filter by return reason                        |
| `sort`    | Sort field                                     |
| `order`   | `asc` or `desc`                                |
| `page`    | Page number                                    |
| `limit`   | Number of results, maximum 100                 |

### 2. Create Return Request

```http
POST /api/returns
```

Example:

```json
{
  "customerName": "Ganesh Tambekar",
  "customerEmail": "ganesh@example.com",
  "customerPhone": "+91 98765 43210",
  "orderId": "ORD-90210",
  "itemId": "ITEM-7701",
  "quantity": 1,
  "reason": "DAMAGED"
}
```

### 3. Get Return Request

```http
GET /api/returns/:id
```

Supports lookup using either the database ID or human-readable reference.

### 4. Edit Return Request

```http
PATCH /api/returns/:id
```

Example:

```json
{
  "customerName": "Ganesh R. Tambekar",
  "customerPhone": "+91 98765 00000"
}
```

### 5. Transition Status / Approve

```http
PATCH /api/returns/:id/status
```

Example:

```json
{
  "status": "APPROVED",
  "resolution": "REFUND",
  "refundAmount": 149.99
}
```

### 6. Add Note

```http
POST /api/returns/:id/notes
```

Example:

```json
{
  "content": "Customer provided photos of shipping damage."
}
```

### 7. Remove Return Request

```http
DELETE /api/returns/:id
```

Example response:

```json
{
  "success": true,
  "message": "Return request RET-2026-00001 has been removed from the desk."
}
```

---

## 🔐 Environment Variables

Create a local `.env` file from `.env.example`.

### Local Development

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/returndesk?schema=public"
NODE_ENV="development"
PORT=3000
```

### Production

For production, use the connection string provided by your cloud PostgreSQL provider, such as Neon:

```env
DATABASE_URL="postgresql://<username>:<password>@<host>/<database>?sslmode=require"
NODE_ENV="production"
```

> **Never commit `.env` or production database credentials to GitHub.**

---

## 💻 Local Setup

### Prerequisites

* Node.js 18.17+ / 20+ / 22+
* npm 9+ / 10+
* PostgreSQL 14–18

### 1. Clone the repository

```bash
git clone <repository-url>
cd returndesk
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Update `.env` with your PostgreSQL connection string.

### 4. Generate Prisma Client

```bash
npm run prisma:generate
```

### 5. Run migrations

For local development:

```bash
npx prisma migrate dev
```

### 6. Seed the database

```bash
npm run prisma:seed
```

### 7. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🐘 PostgreSQL Setup

### Option A — Local PostgreSQL

```env
DATABASE_URL="postgresql://<user>:<password>@localhost:<port>/<database>?schema=public"
```

### Option B — Docker PostgreSQL

```bash
docker run \
  --name returndesk-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=returndesk \
  -p 5432:5432 \
  -d postgres:16-alpine
```

Then:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/returndesk?schema=public"
```

### Option C — Cloud PostgreSQL

You can use providers such as:

* Neon
* Supabase
* Render

Create a PostgreSQL database and use the provider's connection string as `DATABASE_URL`.

---

## 🔄 Prisma Setup & Migrations

### Generate Prisma Client

```bash
npm run prisma:generate
```

### Development Migration

Use this when modifying your Prisma schema locally:

```bash
npx prisma migrate dev
```

### Production Migration

Use this when deploying existing migrations:

```bash
npx prisma migrate deploy
```

### Reset Local Database

```bash
npx prisma migrate reset
```

> **Do not use `migrate reset` against your production database.**

### Prisma Studio

```bash
npx prisma studio
```

---

## 🌱 Seed Data

The seed script populates **36 realistic return requests** covering:

* All five statuses
* All five return reasons
* Realistic customer information
* Multiple chronological notes
* All three resolution types
* Refund examples with valid amounts
* Duplicate-request scenarios
* Soft-deleted requests

Run:

```bash
npm run prisma:seed
```

or:

```bash
npx prisma db seed
```

---

## 🧪 Automated Testing

ReturnDesk includes an automated test runner covering **34 test cases** against the PostgreSQL database.

Run:

```bash
npm test
```

### Test Coverage

#### Rule 1 — Status Lifecycle

* OPEN → IN_REVIEW
* IN_REVIEW → APPROVED
* IN_REVIEW → REJECTED
* APPROVED → COMPLETED
* Invalid lifecycle transitions
* Terminal-state protection

#### Rule 2 — Approval

* Approval without resolution
* Invalid refund amounts
* Refund with replacement
* Refund with store credit

#### Rule 3 — Duplicate Requests

* Duplicate live request prevention
* Re-request after rejection
* Re-request after completion

#### Rule 4 — Field Locking

* Editing after APPROVED
* Editing after REJECTED
* Editing after COMPLETED

#### Notes

* Adding notes in any status
* Chronological ordering
* Immutable notes

#### Rule 5 — Removal

* Removing OPEN requests
* Removing REJECTED requests
* Preventing removal of IN_REVIEW requests
* Preventing removal of APPROVED requests
* Preventing removal of COMPLETED requests
* Excluding removed requests from list results

#### Query Engine

* Search
* Filtering
* Sorting
* Pagination
* Combined search/filter/sort/pagination

---

## 💡 Design Decisions & Interview Rationale

### 1. Why Next.js App Router Route Handlers?

The entire stack remains TypeScript-based. Route handlers allow backend validation, Prisma operations, and API contracts to coexist with the frontend.

### 2. Why Prisma with PostgreSQL?

Prisma provides compile-time type safety, query generation, transactions, and migration management.

PostgreSQL provides:

* ACID transactions
* Relational integrity
* Native enums
* Indexes
* Strong transactional consistency

### 3. Why Centralize Business Rules?

Business rules are isolated inside:

```text
lib/business-rules/
```

This prevents duplicated logic between API routes and tests and ensures the backend remains the source of truth.

### 4. Why Soft Delete?

Soft deletion preserves historical records and audit information while allowing removed requests to disappear from operational queries.

### 5. Why Server-Side Search / Filter / Sort / Pagination?

Processing these operations in PostgreSQL avoids downloading large datasets to the browser and keeps memory usage predictable.

### 6. Why Atomic Reference Generation?

Simple `count()`-based reference generation can produce duplicate references under concurrent requests.

The `ReferenceSequence` table uses an atomic increment inside a transaction to guarantee unique sequential references.

---

## 📌 Assumptions

* **Currency:** All monetary values are treated as USD with two-decimal precision.
* **Reference Year:** References use the current calendar year in the format `RET-YYYY-XXXXX`.
* **Authentication:** The assignment does not specify authentication, so agent actions operate under the standard agent context.
* **Reference Lookup:** Return requests can be retrieved using either the database CUID or human-readable reference.

---

## ⚠️ Known Limitations & Future Scope

### Role-Based Access Control

Currently, all agents have identical permissions.

Future enhancement:

* Supervisor roles
* Restricted high-value refund approvals
* Admin permissions

### File Uploads

Photo attachments are currently represented through notes.

Future enhancement:

* AWS S3
* Cloudinary
* Direct image uploads

### Webhook Integrations

Future integrations could trigger:

* Stripe refunds
* Warehouse inventory updates
* Notification systems
* External order-management workflows

---

## ⏱ Time Spent

| Task                                       |           Time |
| ------------------------------------------ | -------------: |
| Architecture, Data Modeling & Prisma Setup |     ~1.5 hours |
| Business Rules & API Route Handlers        |     ~2.5 hours |
| Frontend Dashboard & Responsive UI         |       ~3 hours |
| Seed Script, Tests & Verification          |     ~1.5 hours |
| Documentation & README                     |        ~1 hour |
| **Total**                                  | **~9.5 hours** |

---

## 🚀 Deployment

Recommended production architecture:

```text
                    ┌──────────────────┐
                    │     GitHub       │
                    │  ReturnDesk Repo │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │      Vercel      │
                    │   Next.js App    │
                    └────────┬─────────┘
                             │
                     DATABASE_URL
                             │
                             ▼
                    ┌──────────────────┐
                    │      Neon        │
                    │    PostgreSQL    │
                    └──────────────────┘
```

For production:

1. Create a PostgreSQL database on Neon.
2. Add the Neon connection string to Vercel as `DATABASE_URL`.
3. Ensure Prisma migrations are committed to Git.
4. Run:

```bash
npx prisma migrate deploy
```

5. Build and deploy the Next.js application.

The application then connects to the cloud PostgreSQL database through Prisma.
