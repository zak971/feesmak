# Maktab Management — Full Stack V1

This version is a real backend-connected application. It does **not** use localStorage as the source of truth.

## Stack

- Next.js App Router
- TypeScript
- PostgreSQL
- Prisma ORM
- bcrypt password hashing
- Signed HTTP-only session cookie
- Server-side role/class authorization
- Zod request validation

## Included V1 backend

- Owner and teacher login
- Owner/teacher roles
- One teacher assigned to a class
- Teacher can only access their own class
- Teacher can create students; the server automatically assigns the teacher's class
- Owner can create classes and assign teachers through the API
- Per-class monthly fee
- Class fee history
- Student-specific fee override
- Monthly fee records
- Pending / partial / paid status
- Partial payments
- Oldest-outstanding-first payment allocation
- Cash / UPI / bank transfer
- Unique receipt number
- Receipt record
- Dashboard aggregation
- Student/class/teacher APIs
- Current-month fee generation
- PostgreSQL Docker setup
- Prisma seed data

## Run locally

### 1. Requirements

Install:

- Node.js 20+
- Docker Desktop

### 2. Install

```bash
npm install
```

### 3. Start PostgreSQL

```bash
docker compose up -d
```

### 4. Create environment file

Copy `.env.example` to `.env`.

Set a strong `SESSION_SECRET`.

### 5. Create database tables

```bash
npx prisma migrate dev --name init
```

### 6. Seed demo data

```bash
npm run db:seed
```

### 7. Start app

```bash
npm run dev
```

Open:

http://localhost:3000

## Demo accounts

Owner:

- Email: `owner@maktab.local`
- Password: `password123`

Teacher 1:

- Email: `teacher1@maktab.local`
- Password: `password123`

Teacher 2:

- Email: `teacher2@maktab.local`
- Password: `password123`

Change these credentials before any real deployment.

## Important architecture decisions

### Fees

A class has a current monthly fee, but every generated student fee stores its own `amount`. Therefore, changing Class 1 from ₹200 to ₹250 does not rewrite old fee records.

### Student transfer

A student's `classId` can change. Existing Fee rows retain their original `classId` and amount, so historical financial records remain tied to the class under which they were generated.

### Teacher security

The teacher's class is determined on the server from the authenticated user. A teacher cannot gain access to another class simply by sending another `classId` in a request.

### Payments

Payments are separated from monthly fees. `PaymentAllocation` records exactly how much of each payment was applied to each fee. This supports partial payments and one payment covering multiple months.

## Production next steps

Before production deployment, add:

- CSRF strategy appropriate to the chosen deployment/auth architecture
- rate limiting / login throttling
- password reset
- owner UI for teacher/class management
- complete student CRUD UI
- fee collection UI
- printable PDF receipts
- reports
- audit logs
- backups and monitoring
- attendance
- progress tracking
- parent portal
- notifications

The database schema is intentionally designed so these can be added without replacing the core financial model.
