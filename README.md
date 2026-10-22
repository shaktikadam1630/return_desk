# ReturnDesk

ReturnDesk is a returns management portal for support teams handling customer return requests. It provides a searchable operations queue, controlled resolutions, lifecycle validation, and an immutable audit trail.

**Built by Shakti Kadam**

## Highlights

- Human-readable references such as `RET-2026-00001`
- Server-side search, filtering, sorting, and pagination
- Five-state workflow: `OPEN` -> `IN_REVIEW` -> `APPROVED` / `REJECTED` -> `COMPLETED`
- Refund, replacement, and store-credit resolution validation
- Duplicate request prevention for live order items
- Field locking after approval or rejection
- Soft deletion and chronological internal notes
- Responsive dashboard with loading states, dialogs, and status badges

## Architecture

```text
Next.js UI
   | HTTP / JSON
Route Handlers
   | Zod validation
Business Rules
   | Prisma ORM
PostgreSQL
```

Business rules are centralized in `lib/business-rules/` and enforced by the API, so direct API calls follow the same rules as the UI.

## Technology

- Next.js 15, React 19, TypeScript, Tailwind CSS
- PostgreSQL, Prisma ORM, and Zod
- Lucide icons and Node.js test runner with `tsx`

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/returns` | Search and list return requests |
| POST | `/api/returns` | Create a return request |
| GET/PATCH/DELETE | `/api/returns/:id` | Read, edit, or soft-delete a request |
| PATCH | `/api/returns/:id/status` | Change status or approve a request |
| POST | `/api/returns/:id/notes` | Add an immutable internal note |

## Local Development

Requirements: Node.js 20+ and PostgreSQL 14+.

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

Open `http://localhost:3000`.

Create `.env` with:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/returndesk?schema=public"
```

### PostgreSQL with Docker

```bash
docker run --name returndesk-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=returndesk \
  -p 5432:5432 \
  -d postgres:16-alpine
```

## Production Deployment

Build and run the Next.js application on AWS EC2, Vercel, or another Node.js platform. Configure `DATABASE_URL` as a protected environment variable, then run migrations before serving traffic:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

Never commit `.env` or production database credentials. Use HTTPS and a process manager such as systemd or PM2 when deploying to EC2.

## Tests

```bash
npm test
```

## Repository

https://github.com/shaktikadam1630/return_desk
