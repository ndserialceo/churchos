# ChurchOS

Multi-branch church management system for Nigerian churches.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your database URL and Africa's Talking credentials
```

## Database

```bash
npx prisma migrate dev --name init
npx prisma generate
```

## Seed

```bash
npx prisma db seed
```

## Run

```bash
npm run dev
```

## Features

- **Member Management** — Register, track, and manage church members
- **Finance & Accounting** — Record tithes, offerings, pledges, and expenses
- **Communication Hub** — Send SMS (Africa's Talking) and WhatsApp messages
- **Follow-up & Visitation** — Track new converts, assign follow-ups
- **Volunteer Management** — Manage ministries, roles, and assignments
- **Branch Oversight** — Multi-branch HQ dashboard with scoped permissions