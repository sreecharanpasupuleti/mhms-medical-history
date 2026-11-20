# MHMS — Medical History Management System

A full-stack, role-based **Medical History Management System (MHMS)** built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, **PostgreSQL**, **NextAuth.js**, and **Vercel Blob**.

---

## Features

- **Role-Based Authentication & Route Protection**
  - NextAuth.js Credentials authentication with `bcryptjs` password hashing.
  - Middleware and server-side route guards enforcing strict access across `ADMIN`, `DOCTOR`, and `PATIENT` roles, with automatic login redirects and an Access Denied page for mismatched roles.
- **Admin Dashboard (`/admin`)**
  - System-wide clinical statistics (users, active accounts, doctors, patients, appointments, medical records, allergies, prescriptions, lab reports).
  - Full User Management: view, search, filter by role, create, edit, activate/deactivate, and delete users.
  - Dedicated management views for Doctors, Patients, Appointments, Medical Records, Allergies, Prescriptions, and Lab Reports.
- **Doctor Dashboard (`/doctor`)**
  - View assigned patients and full active patient directory.
  - Schedule, confirm, complete, or cancel appointments with automatic double-booking prevention.
  - Record diagnoses, symptoms, treatment plans, and clinical notes.
  - Document patient allergies (`MILD`, `MODERATE`, `SEVERE`).
  - Issue prescriptions and upload diagnostic lab reports (PDF, JPG, PNG, DOCX) via Vercel Blob.
- **Patient Dashboard (`/patient`)**
  - Personal health summary with severe allergy alerts and profile management.
  - Book conflict-free appointments with available doctors and cancel pending bookings.
  - View longitudinal medical records, allergies, prescriptions, and lab reports.
- **CSV Exports & Print-Friendly Clinical Sheets**
  - Download CSV exports for Appointments, Patients, Doctors, Medical Records, Prescriptions, and Lab Reports.
  - Dedicated `@media print` layouts for Patient Medical Summary, Appointment Details, Official Prescription (Rx), and Lab Reports.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Database & ORM:** PostgreSQL + Prisma ORM
- **Authentication:** NextAuth.js (`CredentialsProvider` + `bcryptjs`)
- **File Storage:** Vercel Blob (`@vercel/blob`)
- **Validation:** Zod
- **Deployment:** Vercel

---

## Project Structure

```text
prisma/
  schema.prisma        # PostgreSQL models & enums
  seed.ts              # Seed script for Admin, Doctor, Patient accounts & sample records
public/
  images/              # Clinical UI visual assets
src/
  app/                 # Next.js 14 App Router pages & /api/* endpoints
    admin/             # Admin dashboard & management pages
    doctor/            # Doctor clinical desk pages
    patient/           # Patient portal pages
    print/             # Print-friendly medical summary, Rx, appointment & lab pages
    api/               # Auth, users, appointments, records, allergies, Rx, labs, upload, export
  components/          # Reusable UI, layout shell, modals, clinical & admin panels
  lib/                 # Prisma singleton, NextAuth config, validation, CSV & data access
  types/               # Shared TypeScript DTOs and NextAuth type augmentations
  middleware.ts        # Edge role-based route protection
```

---

## Environment Variables

Copy `.env.example` to `.env` (already created locally with safe placeholder values):

```env
DATABASE_URL=postgresql://placeholder
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=mhms_local_secret_key_2026_change_this_before_deploying
BLOB_READ_WRITE_TOKEN=placeholder_blob_token
```

### Where to Replace Each Placeholder

| Variable | Local Development | Production (Vercel) |
| :--- | :--- | :--- |
| `DATABASE_URL` | Replace `postgresql://placeholder` in `.env` with your Neon PostgreSQL connection string (or local Postgres URI). | Set in **Vercel Project → Settings → Environment Variables** using your Neon pooled connection string (`?sslmode=require`). |
| `NEXTAUTH_URL` | Keep `http://localhost:3000` in `.env` for local runs. | Set to your deployed URL (e.g., `https://your-mhms-app.vercel.app`). |
| `NEXTAUTH_SECRET` | Replace in `.env` with a strong random secret (`openssl rand -base64 32`). | Set a unique 32+ character secret in Vercel Environment Variables. |
| `BLOB_READ_WRITE_TOKEN` | Replace `placeholder_blob_token` in `.env` with your Vercel Blob token to upload directly to Vercel Blob locally. | Auto-created when connecting a Vercel Blob store, or set manually in Vercel Environment Variables. |

> **Note:** When `DATABASE_URL` is `postgresql://placeholder` or `BLOB_READ_WRITE_TOKEN` is `placeholder_blob_token`, MHMS gracefully runs using an automatic local preview data/upload fallback so you can test the UI immediately before provisioning Neon and Vercel Blob. Once you replace those variables and run Prisma migrations, it switches automatically to PostgreSQL and Vercel Blob.

---

## Local Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure `.env`:**
   Update `DATABASE_URL`, `NEXTAUTH_SECRET`, and `BLOB_READ_WRITE_TOKEN` in `.env` with your real Neon and Vercel Blob credentials.

3. **Generate Prisma Client & run database migrations:**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. **Seed test accounts & clinical sample data:**
   ```bash
   npx prisma db seed
   ```

   **Seeded Test Accounts:**
   - **Admin:** `admin@mhms.com` / `Admin@123`
   - **Doctor:** `doctor1@example.com` / `Doctor@123`
   - **Patient:** `patient1@example.com` / `Patient@123`

5. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

---

## How to Create a PostgreSQL Database Using Neon

1. Sign in at [https://neon.tech](https://neon.tech) and click **New Project**.
2. Name the project `mhms-db`, choose **PostgreSQL 16**, and select a region close to your Vercel deployment (e.g., `us-east-1`).
3. Copy the **Connection String** from the Neon Dashboard (select **Pooled connection** for Vercel serverless functions):
   ```text
   postgresql://<user>:<password>@<endpoint>-pooler.<region>.aws.neon.tech/<dbname>?sslmode=require
   ```
4. Paste this URL as `DATABASE_URL` in your local `.env` (for migrations/seeding) and in Vercel Environment Variables.

---

## How to Create a Vercel Blob Token

1. Open your project in the **Vercel Dashboard** and go to the **Storage** tab.
2. Click **Create Database** → select **Blob** → give it a store name (e.g., `mhms-lab-reports`) and click **Create**.
3. Open the newly created Blob store and navigate to **.env.local** or **Tokens**.
4. Copy the `BLOB_READ_WRITE_TOKEN` value (`vercel_blob_rw_...`) into your local `.env` if testing Blob uploads locally, and ensure the Blob store is connected to your Vercel project environments (`Production`, `Preview`, `Development`).

---

## Deploying to Vercel

1. Push your repository to **GitHub**.
2. In the [Vercel Dashboard](https://vercel.com/new), click **Add New Project** and import your GitHub repository.
3. Under **Build & Development Settings**, keep defaults (`npm run build` automatically runs `prisma generate && next build`).
4. Go to **Settings → Environment Variables** and add:
   - `DATABASE_URL` = *(your Neon PostgreSQL URL)*
   - `NEXTAUTH_URL` = `https://your-project-name.vercel.app`
   - `NEXTAUTH_SECRET` = *(a random secret generated via `openssl rand -base64 32`)*
   - `BLOB_READ_WRITE_TOKEN` = *(your Vercel Blob token)*
5. Click **Deploy**.
6. Once deployed, push the schema and seed data to your Neon database from your local terminal:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```
