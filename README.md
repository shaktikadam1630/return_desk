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

## Development

Create a `.env` file with a PostgreSQL connection string:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/returndesk?schema=public"
```

Run the development server:

```bash
npm run dev
```

## AWS EC2 Deployment

1. Create an Ubuntu EC2 instance and allow inbound HTTP traffic on port `80`.
2. Install Node.js 20, PostgreSQL, and Git, then clone the repository.
3. Configure `DATABASE_URL` in `.env` and apply the Prisma migration:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

Use Nginx to proxy port `80` to the Next.js process on port `3000`, and run the app with a process manager such as systemd or PM2.

## Tests

```bash
npm test
```

## Repository

https://github.com/shaktikadam1630/return_desk
