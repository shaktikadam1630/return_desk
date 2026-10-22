# ReturnDesk

ReturnDesk is a full-stack returns operations console for support teams. It provides a searchable request queue, lifecycle enforcement, audit notes, and controlled refund, replacement, and store-credit resolutions.

## Stack

- Next.js 15, React 19, TypeScript, Tailwind CSS
- PostgreSQL 16, Prisma ORM, Zod validation
- Docker Compose for the application and database

## Run locally

Requirements: Docker Desktop or Docker Engine with Compose.

```bash
cp .env.example .env
# Set a strong POSTGRES_PASSWORD in .env and keep DATABASE_URL in sync.
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
```

Open `http://localhost:3000`.

Useful commands:

```bash
docker compose logs -f app
docker compose ps
docker compose down
```

## Deploy on AWS EC2

1. Create an Ubuntu EC2 instance with inbound TCP `22` and `80` rules. Keep port `3000` private.
2. Install Docker and Git, then clone this repository.
3. Create `.env`, set a strong database password, and run:

```bash
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
```

4. Put Nginx in front of the app and proxy port `80` to `127.0.0.1:3000`.
5. For production database hosting, use Amazon RDS PostgreSQL and set `DATABASE_URL` as an EC2 or ECS secret instead of using the Compose database service.

## Tests

```bash
npm install
npm test
```

## Repository

GitHub: https://github.com/shaktikadam1630/return_desk
