# ReturnDesk

ReturnDesk is a full-stack returns management system for support teams. It provides a searchable request queue, lifecycle validation, audit notes, and controlled refund, replacement, and store-credit resolutions.

## Stack

- Next.js 15 and React 19
- TypeScript and Tailwind CSS
- PostgreSQL and Prisma ORM
- Zod validation and REST route handlers

## Local Setup

Requirements: Node.js 20+ and PostgreSQL.

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Open `http://localhost:3000`.

## Tests

```bash
npm test
```

## Repository

https://github.com/shaktikadam1630/return_desk
