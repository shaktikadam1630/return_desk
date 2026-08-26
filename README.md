# ReturnDesk — Support Returns Management System

> A robust, full-stack returns desk application built with Next.js (App Router), TypeScript, Tailwind CSS, PostgreSQL, and Prisma ORM. Centralized business rules, atomic reference generation, and database-level constraints guarantee strict compliance with e-commerce return workflows.

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Project Structure](#project-structure)
6. [Database Design](#database-design)
7. [Business Rules (The 5 Core Rules)](#business-rules)
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

**ReturnDesk** is a purpose-built returns management portal for support agents handling customer return requests for an online store. It streamlines the lifecycle of return requests: raising requests against orders, searching/filtering at scale, investigating issues, adding immutable chronological notes, issuing resolutions (Refund, Replacement, Store Credit), and executing transitions through a deterministic state machine.

Every business rule is enforced **strictly on the server side** in dedicated business logic modules. Even direct API calls bypassing the UI are fully validated and rejected with machine-readable errors and appropriate HTTP status codes.

---

## 🚀 Features

- **Automated Human-Readable Reference**: Generates atomic, sequential references (`RET-2026-00001`) via database transactions.
- **Strict 5-State Lifecycle Engine**: Enforces legal transitions (`OPEN` $\rightarrow$ `IN_REVIEW` $\rightarrow$ `APPROVED` / `REJECTED` $\rightarrow$ `COMPLETED`).
- **Server-Side Query Engine**: Multi-field search (ILIKE on customer, email, order, reference), filtering by status and reason, sorting, and pagination performed directly in PostgreSQL.
- **Search Debouncing**: 350ms frontend search debounce preventing keystroke API spam.
- **Conditional Resolution & Refund Validation**: Enforces mandatory positive refund amounts for `REFUND`, while disallowing refund amounts for `REPLACEMENT` and `STORE_CREDIT`.
- **Concurrency-Safe Duplicate Request Prevention**: Forbids duplicate live requests for the same order and item until previous requests reach terminal states (`REJECTED` or `COMPLETED`).
- **Field Locking After Decision**: Disallows editing customer and item details once a request is `APPROVED`, `REJECTED`, or `COMPLETED`.
- **Soft Deletion Removal**: Soft-deletes eligible requests (`OPEN` or `REJECTED`), keeping full database audit trails while hiding them from active queries.
- **Immutable Chronological Notes**: Internal audit notes can be added at any point in the lifecycle; notes cannot be edited or deleted.
- **Fully Responsive UI**: Modern dashboard with status badge color-coding, modal dialogs, loading skeletons, error toasts, and 375px mobile responsiveness.

---

## 🛠 Tech Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React 19, Next.js 15 (App Router), Tailwind CSS, Lucide Icons | High-performance, server-rendered components, clean utility-first styling |
| **Backend** | Next.js API Route Handlers (Node.js runtime) | Type-safe RESTful API endpoints colocated with frontend |
| **Validation** | Zod 3.24 | Schema validation for query parameters, request bodies, and mutations |
| **ORM** | Prisma ORM 6.4 | Type-safe queries, transaction management, migration versioning |
| **Database** | PostgreSQL 18 | ACID compliance, relational integrity, indexes, enums |
| **Testing** | Node.js / `tsx` automated test runner | Standalone runner validating all 34 test cases against live database |

---

## 🏗 Architecture

```
                 +-----------------------------------------------+
                 |              ReturnDesk Frontend              |
                 |  (Next.js App Router + Tailwind CSS + React)  |
                 +-----------------------------------------------+
                                         |
                                         | HTTP / JSON (REST)
                                         v
                 +-----------------------------------------------+
                 |            Next.js Route Handlers             |
                 |   app/api/returns/ route.ts & [id]/route.ts   |
                 +-----------------------------------------------+
                                         |
                                         | Zod Validation & Error Handling
                                         v
                 +-----------------------------------------------+
                 |       Centralized Business Rules Layer        |
                 |   lib/business-rules/ (Lifecycle, Approval,   |
                 |      Duplicates, Locking, Soft-Removal)       |
                 +-----------------------------------------------+
                                         |
                                         | Type-safe Transactions & Queries
                                         v
                 +-----------------------------------------------+
                 |                  Prisma ORM                   |
                 +-----------------------------------------------+
                                         |
                                         | SQL / Connection Pool
                                         v
                 +-----------------------------------------------+
                 |             PostgreSQL Database               |
                 |     (Enums, Indexes, Soft Deletes, Tables)    |
                 +-----------------------------------------------+
```

---

## 📁 Project Structure

```
returndesk/
├── app/
│   ├── api/
│   │   └── returns/
│   │       ├── route.ts                 # GET (list/filter/search/page), POST (create)
│   │       └── [id]/
│   │           ├── route.ts             # GET (fetch single), PATCH (edit details), DELETE (soft-delete)
│   │           ├── status/
│   │           │   └── route.ts         # PATCH (status transition & approval)
│   │           └── notes/
│   │               └── route.ts         # POST (append note)
│   ├── returns/
│   │   ├── new/
│   │   │   └── page.tsx                 # Create Return Request form page
│   │   └── [id]/
│   │       └── page.tsx                 # Request Details & Workflow management page
│   ├── page.tsx                         # Main Returns Desk dashboard (Table, Filters, Stats)
│   ├── layout.tsx                       # Root layout with header navigation & ToastProvider
│   └── globals.css                      # Tailwind base & custom design tokens
├── components/
│   ├── returns/
│   │   ├── returns-table.tsx            # Responsive desktop table and mobile cards
│   │   ├── returns-filter-bar.tsx       # Debounced search bar, status/reason filters, sort
│   │   ├── status-badge.tsx             # Color-coded visual status badge
│   │   ├── reason-badge.tsx             # Visual reason badge with icons
│   │   ├── resolution-badge.tsx         # Resolution badge with dynamic refund amount
│   │   ├── approval-modal.tsx           # Approval dialog with resolution & refund inputs
│   │   ├── confirm-dialog.tsx           # Reusable confirmation modal (Review, Reject, Complete, Remove)
│   │   ├── edit-details-modal.tsx       # Modal to edit customer/item details before decision
│   │   └── notes-section.tsx            # Chronological notes feed & add note form
│   └── ui/
│       └── toast.tsx                    # Toast notification context and UI container
├── lib/
│   ├── prisma.ts                        # Singleton Prisma client instance
│   ├── errors.ts                        # Standardized AppError and API error response formatters
│   ├── reference.ts                     # Atomic unique reference generator (RET-YYYY-XXXXX)
│   ├── utils.ts                         # Label formatting, currency, date, cn utility
│   ├── validation/
│   │   └── returns.ts                   # Centralized Zod schemas for request validation
│   └── business-rules/
│       ├── lifecycle.ts                 # Rule 1: Allowed transitions state machine
│       ├── approval.ts                  # Rule 2: Resolution & refund amount rules
│       ├── duplicate.ts                 # Rule 3: One live request per order/item check
│       ├── locking.ts                   # Rule 4: Field locking after decision
│       └── removal.ts                   # Rule 5: Soft-deletion eligibility
├── prisma/
│   ├── schema.prisma                    # PostgreSQL schema with enums, indexes, constraints
│   ├── migrations/                      # Version-controlled SQL migrations
│   └── seed.ts                          # Comprehensive seed script (36+ realistic records)
├── tests/
│   └── business-rules.test.ts           # Automated test suite covering all 34 requirements
├── .env.example                         # Documented environment configuration template
├── tailwind.config.ts                   # Tailwind CSS configuration
├── package.json
└── README.md
```

---

## 🗄 Database Design

### Prisma Schema (`prisma/schema.prisma`)

```prisma
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

### Database Constraints & Indexes Rationale

1. **Unique Reference (`reference @unique`)**: Guarantees that no two return requests share the same human-readable reference identifier.
2. **Compound Index `[status, removedAt]`**: Highly optimizes the default desk query which filters out soft-deleted records (`removedAt IS NULL`) and filters by status.
3. **Compound Index `[orderId, itemId]`**: Speeds up Rule 3 duplicate live request checks (`findFirst where orderId, itemId, status in [OPEN, IN_REVIEW, APPROVED]`).
4. **Foreign Key `Note.requestId -> ReturnRequest.id`**: Preserves relational integrity with cascade on delete.
5. **Atomic Sequence Table (`ReferenceSequence`)**: Uses an upsert with atomic increment (`lastValue: { increment: 1 }`) within a Prisma transaction to eliminate race conditions when generating sequential reference numbers under concurrent traffic.

---

## ⚖️ Business Rules

All 5 business rules are encapsulated in `lib/business-rules/` and enforced by Route Handlers.

### Rule 1 — Status Lifecycle State Machine
- **Allowed Transitions**:
  - `OPEN` $\rightarrow$ `IN_REVIEW`
  - `IN_REVIEW` $\rightarrow$ `APPROVED`
  - `IN_REVIEW` $\rightarrow$ `REJECTED`
  - `APPROVED` $\rightarrow$ `COMPLETED`
- **Terminal States**: `REJECTED` and `COMPLETED`. Nothing moves out of them.
- **Illegal Transitions**: (e.g. `OPEN` $\rightarrow$ `APPROVED`, `OPEN` $\rightarrow$ `COMPLETED`, `IN_REVIEW` $\rightarrow$ `COMPLETED`, `APPROVED` $\rightarrow$ `REJECTED`, `REJECTED` $\rightarrow$ `anything`, `COMPLETED` $\rightarrow$ `anything`) are rejected with `409 Conflict` and error code `INVALID_STATUS_TRANSITION` or `TERMINAL_STATE_LOCKED`.

### Rule 2 — Approval Requires Resolution
- A request cannot transition to `APPROVED` without a resolution (`REFUND`, `REPLACEMENT`, `STORE_CREDIT`).
- If `resolution === REFUND`:
  - `refundAmount` is strictly required.
  - `refundAmount` must be a positive number ($> 0$).
- If `resolution === REPLACEMENT` or `STORE_CREDIT`:
  - `refundAmount` must be `null` / omitted. Attempting to pass a refund amount is rejected or cleansed to `null`.
- Violations return `409 Conflict` / `400 Bad Request` with error code `RESOLUTION_REQUIRED`, `REFUND_AMOUNT_REQUIRED`, or `INVALID_REFUND_AMOUNT`.

### Rule 3 — One Live Request Per Order/Item
- A customer cannot have two live requests for the same item on the same order.
- **Live Statuses**: `OPEN`, `IN_REVIEW`, `APPROVED` (where `removedAt IS NULL`).
- **Closed Statuses**: `REJECTED`, `COMPLETED`.
- Before creating a request (or updating order/item), a database check inside a transaction verifies no live request exists.
- If a live request exists, creation is rejected with `409 Conflict` and error code `DUPLICATE_LIVE_REQUEST`.
- Once the existing request reaches `REJECTED` or `COMPLETED`, a new request for the same order and item is permitted.

### Rule 4 — Locked Once Decided
- Once a request reaches `APPROVED`, `REJECTED`, or `COMPLETED`:
  - The following customer & item fields are immutable:
    - `customerName`, `customerEmail`, `customerPhone`
    - `orderId`, `itemId`, `quantity`, `reason`
  - Modification attempts are rejected with `409 Conflict` and error code `REQUEST_LOCKED`.
- In `OPEN` and `IN_REVIEW` statuses, editing permitted details is allowed.
- Internal **notes can still be added** at any point in the lifecycle.

### Rule 5 — Soft Deletion Removal
- Removing a request sets `removedAt = now()`. The physical database record is **never deleted**.
- Only requests in `OPEN` or `REJECTED` status may be removed.
- Requests in `IN_REVIEW`, `APPROVED`, or `COMPLETED` status cannot be removed (`409 Conflict`, error code `CANNOT_REMOVE_REQUEST`).
- Soft-deleted requests are excluded from `GET /api/returns` and return `404 Not Found` on `GET /api/returns/:id`.

---

## 📡 API Documentation

Standard Machine-Readable Error Response format:
```json
{
  "error": {
    "code": "DUPLICATE_LIVE_REQUEST",
    "message": "An active return request (RET-2026-00001, status: OPEN) already exists for Order 'ORD-90210' and Item 'ITEM-7701'.",
    "details": { ... }
  }
}
```

### 1. List Return Requests
- **`GET /api/returns`**
- **Query Parameters**:
  - `search` (string, optional): Search term for customer name, customer email, order ID, or reference.
  - `status` (enum, optional): `OPEN`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `COMPLETED`.
  - `reason` (enum, optional): `DAMAGED`, `WRONG_ITEM`, `SIZE_ISSUE`, `NOT_AS_DESCRIBED`, `CHANGED_MIND`.
  - `sort` (string, optional, default: `"createdAt"`): `createdAt`, `updatedAt`, `reference`, `customerName`, `orderId`, `status`.
  - `order` (string, optional, default: `"desc"`): `asc` | `desc`.
  - `page` (number, optional, default: `1`): Page number.
  - `limit` (number, optional, default: `10`): Items per page (max 100).
- **Response `200 OK`**:
  ```json
  {
    "data": [
      {
        "id": "cuid...",
        "reference": "RET-2026-00001",
        "customerName": "Ganesh Tambekar",
        "customerEmail": "ganesh@example.com",
        "customerPhone": "+91 98765 43210",
        "orderId": "ORD-90210",
        "itemId": "ITEM-7701",
        "quantity": 1,
        "reason": "DAMAGED",
        "status": "OPEN",
        "resolution": null,
        "refundAmount": null,
        "createdAt": "2026-08-25T17:00:00.000Z",
        "updatedAt": "2026-08-25T17:00:00.000Z",
        "_count": { "notes": 1 }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 35,
      "totalPages": 4
    }
  }
  ```

### 2. Create Return Request
- **`POST /api/returns`**
- **Request Body**:
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
- **Response `201 Created`**: Returns created ReturnRequest with server-generated reference.
- **Errors**: `400 Bad Request` (Zod validation error), `409 Conflict` (`DUPLICATE_LIVE_REQUEST`).

### 3. Get Single Return Request
- **`GET /api/returns/:id`**
- Supports lookup by database `id` or `reference`. Excludes soft-deleted records.
- **Response `200 OK`**: Returns ReturnRequest with chronological `notes` array.
- **Errors**: `404 Not Found`.

### 4. Edit Return Request Details
- **`PATCH /api/returns/:id`**
- **Request Body** (partial fields):
  ```json
  {
    "customerName": "Ganesh R. Tambekar",
    "customerPhone": "+91 98765 00000"
  }
  ```
- **Response `200 OK`**: Returns updated ReturnRequest.
- **Errors**: `404 Not Found`, `409 Conflict` (`REQUEST_LOCKED` if in APPROVED/REJECTED/COMPLETED; `DUPLICATE_LIVE_REQUEST` if changing orderId/itemId to an existing live request).

### 5. Transition Status & Approval
- **`PATCH /api/returns/:id/status`**
- **Request Body**:
  ```json
  {
    "status": "APPROVED",
    "resolution": "REFUND",
    "refundAmount": 149.99
  }
  ```
- **Response `200 OK`**: Returns updated ReturnRequest.
- **Errors**: `400 Bad Request`, `404 Not Found`, `409 Conflict` (`INVALID_STATUS_TRANSITION`, `RESOLUTION_REQUIRED`, `INVALID_REFUND_AMOUNT`).

### 6. Add Note
- **`POST /api/returns/:id/notes`**
- Notes can be added in any status and are immutable.
- **Request Body**:
  ```json
  {
    "content": "Customer provided photos of shipping damage."
  }
  ```
- **Response `201 Created`**: Returns created Note object.

### 7. Remove Return Request (Soft Delete)
- **`DELETE /api/returns/:id`**
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Return request RET-2026-00001 has been removed from the desk."
  }
  ```
- **Errors**: `404 Not Found`, `409 Conflict` (`CANNOT_REMOVE_REQUEST` if status is not `OPEN` or `REJECTED`).

---

## 🔐 Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5433/returndesk?schema=public` |
| `NODE_ENV` | Environment mode | `development` / `production` |
| `PORT` | Optional server port (default: 3000) | `3000` |

---

## 💻 Local Setup

### Prerequisites
- **Node.js**: v18.17+ or v20+ / v22+
- **npm**: v9+ / v10+
- **PostgreSQL**: v14, v15, v16, v17, or v18

### Step-by-Step Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd returndesk
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your PostgreSQL credentials if different from default
   ```

4. **Initialize database schema & run migrations**:
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Seed the database with test data**:
   ```bash
   npx prisma db seed
   ```

6. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐘 PostgreSQL Setup

### Option A: Local PostgreSQL
Make sure PostgreSQL is running on your machine. Update `DATABASE_URL` in `.env`:
```env
DATABASE_URL="postgresql://<user>:<password>@localhost:<port>/<dbname>?schema=public"
```

### Option B: Docker PostgreSQL Container
Run a lightweight PostgreSQL container:
```bash
docker run --name returndesk-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=returndesk -p 5432:5432 -d postgres:16-alpine
```
Then set in `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/returndesk?schema=public"
```

### Option C: Cloud PostgreSQL (Supabase / Neon / Render)
Create a free database on [Neon](https://neon.tech) or [Supabase](https://supabase.com) and paste the connection string into `.env`.

---

## 🔄 Prisma Setup & Migrations

- **Generate Prisma Client**:
  ```bash
  npm run prisma:generate
  ```
- **Apply migrations**:
  ```bash
  npm run prisma:migrate
  ```
- **Reset database (clean slate)**:
  ```bash
  npx prisma migrate reset
  ```
- **Open Prisma Studio (database GUI)**:
  ```bash
  npx prisma studio
  ```

---

## 🌱 Seed Data

The seed script (`prisma/seed.ts`) populates **36 realistic return requests** with full variety:
- All 5 statuses (`OPEN`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `COMPLETED`).
- All 5 return reasons (`DAMAGED`, `WRONG_ITEM`, `SIZE_ISSUE`, `NOT_AS_DESCRIBED`, `CHANGED_MIND`).
- Realistic customer names, emails, order numbers, and item SKUs.
- Multi-step chronological notes attached to requests.
- All 3 resolution types (`REFUND` with valid amounts, `REPLACEMENT`, `STORE_CREDIT`).
- Showcase of Rule 3: Customer with an earlier `REJECTED` request raising a new `OPEN` request for the same order and item.
- Soft-deleted requests (`removedAt IS NOT NULL`) demonstrating list exclusion.

Run seed command:
```bash
npm run prisma:seed
# or
npx prisma db seed
```

---

## 🧪 Automated Testing

ReturnDesk includes an automated test runner (`tests/business-rules.test.ts`) that executes **all 34 test cases** against the live PostgreSQL database:

```bash
npm test
```

### 34 Test Cases Covered:

```
--- Rule 1: Status Lifecycle ---
  ✅ 1. OPEN -> IN_REVIEW succeeds
  ✅ 2. IN_REVIEW -> APPROVED succeeds with valid resolution
  ✅ 3. IN_REVIEW -> REJECTED succeeds
  ✅ 4. APPROVED -> COMPLETED succeeds
  ✅ 5. OPEN -> APPROVED fails
  ✅ 6. OPEN -> COMPLETED fails
  ✅ 7. OPEN -> REJECTED fails
  ✅ 8. APPROVED -> REJECTED fails
  ✅ 9. COMPLETED -> anything fails
  ✅ 10. REJECTED -> anything fails

--- Rule 2: Approval Requires Resolution ---
  ✅ 11. Approval without resolution fails
  ✅ 12. Refund with zero/negative amount fails
  ✅ 13. Replacement with refund amount fails
  ✅ 14. Store Credit with refund amount fails

--- Rule 3: One Live Request Per Order/Item ---
  ✅ 15. Duplicate live order/item request fails
  ✅ 16. Duplicate request becomes allowed after old request is REJECTED
  ✅ 17. Duplicate request becomes allowed after old request is COMPLETED

--- Rule 4: Locked Once Decided ---
  ✅ 18. Editing customer/item details after APPROVED fails
  ✅ 19. Editing customer/item details after REJECTED fails
  ✅ 20. Editing customer/item details after COMPLETED fails

--- Notes Functionality ---
  ✅ 21. Notes can be added to any status
  ✅ 22. Notes cannot be edited/deleted & returned chronologically

--- Rule 5: Removal ---
  ✅ 23. Removing OPEN succeeds
  ✅ 24. Removing REJECTED succeeds
  ✅ 25. Removing IN_REVIEW fails
  ✅ 26. Removing APPROVED fails
  ✅ 27. Removing COMPLETED fails
  ✅ 28. Removed requests are not returned by normal list API
  ✅ 29. Removed requests cannot be fetched normally

--- List Engine: Search, Filter, Sort, Pagination ---
  ✅ 30. Search works (customer, email, order, reference)
  ✅ 31. Filtering works (status & reason)
  ✅ 32. Sorting works (ascending & descending)
  ✅ 33. Pagination works (page & limit slicing)
  ✅ 34. Search + filtering + sorting + pagination work together
```

---

## 💡 Design Decisions & Interview Rationale

1. **Why Next.js App Router Route Handlers?**
   - Keeps the entire stack in TypeScript with zero impedance mismatch. Route handlers allow co-locating backend validation, Prisma client, and API contracts alongside the React UI.

2. **Why Prisma ORM with PostgreSQL?**
   - Prisma delivers compile-time type safety and query generation while enforcing relational constraints and migrations. PostgreSQL was chosen for robust ACID compliance, native ENUM support, and transactional consistency.

3. **Why Centralize Business Rules in `lib/business-rules/`?**
   - Placing business rule validation into dedicated pure functions and transaction helpers prevents logic duplication between route handlers and unit tests, and ensures the backend remains the single source of truth regardless of client-side validation.

4. **Why Soft Deletion via `removedAt`?**
   - Financial and inventory audit logs must never lose historical records. Soft deletion retains full data integrity in PostgreSQL while excluding records from operational queries via compound indexed filters (`removedAt: null`).

5. **Why Server-Side Search, Filter, Sort, and Pagination?**
   - In production e-commerce environments with tens of thousands of return requests, downloading all records into the browser degrades client performance. Executing `ILIKE`, `WHERE`, `ORDER BY`, and `LIMIT/OFFSET` directly in PostgreSQL guarantees constant memory usage and instant response times.

6. **Why Atomic Reference Generation via `ReferenceSequence`?**
   - Generating sequential numbers like `RET-2026-00001` via simple `count()` suffers from race conditions under concurrent requests. Using an atomic PostgreSQL sequence table with `upsert` and `lastValue: { increment: 1 }` inside a transaction ensures sequential, unique references with zero collisions.

---

## 📌 Assumptions

- **Currency**: All monetary values are treated as USD ($) with precision up to two decimal places (`Decimal(10, 2)` in PostgreSQL).
- **Return Reference Year**: References default to the current calendar year (`RET-YYYY-XXXXX`).
- **Support Agent Authentication**: As ReturnDesk is an internal tool take-home brief without an auth spec, agent actions and notes are recorded under standard agent context.
- **Lookup by Reference**: `GET /api/returns/:id` supports lookup by both database `cuid` and human-readable `reference` for agent convenience.

---

## ⚠️ Known Limitations & Future Scope

- **Role-Based Access Control (RBAC)**: Currently all agents have identical permissions. A future enhancement could restrict approval of refunds over $500 to senior supervisors.
- **File Uploads**: Photo attachments currently referenced in notes could be expanded to direct S3/Cloudinary image uploads.
- **Webhook Integrations**: Could trigger automated Stripe refund payouts or warehouse inventory restocking webhooks upon `APPROVED` $\rightarrow$ `COMPLETED` transitions.

---

## ⏱ Time Spent

- **Architecture, Data Modeling & Prisma Setup**: ~1.5 hours
- **Centralized Business Rules & API Route Handlers**: ~2.5 hours
- **Frontend Dashboard, Filter Bar, Modals & Mobile View**: ~3 hours
- **Seed Script, Automated Tests & Verification**: ~1.5 hours
- **Documentation & README**: ~1 hour
- **Total Time**: ~9.5 hours
#   r e t u r n d e s k  
 