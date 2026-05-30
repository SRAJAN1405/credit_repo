# 🏦 Loan Management System (LMS)

A full-stack loan management platform built with **Next.js**, **Express**, **MongoDB**, and **TypeScript**.

---

## 📋 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Backend | Node.js + Express.js + TypeScript |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| State | Zustand |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone & Setup

```bash
git clone <repo-url>
cd lms
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm run seed      # Creates all role accounts
npm run dev       # Starts on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env.local
# Ensure NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm install
npm run dev       # Starts on http://localhost:3000
```

---

## 🔑 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@lms.com | Admin@123 |
| Sales | sales@lms.com | Sales@123 |
| Sanction | sanction@lms.com | Sanction@123 |
| Disbursement | disbursement@lms.com | Disburse@123 |
| Collection | collection@lms.com | Collect@123 |
| Borrower | borrower@lms.com | Borrow@123 |

---

## 🏗️ Architecture

### MongoDB Collections

#### `users`
```
_id, name, email, password (hashed), role, phone, createdAt, updatedAt
```

#### `loans`
```
_id, borrower (ref: User), personalDetails, salarySlip, loanConfig,
status, rejectionReason, sanctionedBy, sanctionedAt, disbursedBy,
disbursedAt, closedAt, totalPaid, outstandingBalance, createdAt
```

#### `payments`
```
_id, loan (ref: Loan), borrower (ref: User), utrNumber (unique),
amount, paymentDate, recordedBy (ref: User), createdAt
```

### Loan Status Lifecycle

```
applied → sanctioned → disbursed → closed
       ↘ rejected
```

| Status | Triggered By | Who |
|--------|-------------|-----|
| applied | Borrower submits form | borrower |
| sanctioned | Sanction executive approves | sanction / admin |
| rejected | Sanction executive rejects | sanction / admin |
| disbursed | Disbursement executive releases | disbursement / admin |
| closed | Auto when totalPaid >= totalRepayment | system |

---

## 🔐 Role-Based Access Control

| Role | Access |
|------|--------|
| borrower | Application portal only (`/borrower/*`) |
| sales | Sales module — lead tracking |
| sanction | Sanction module — approve/reject applied loans |
| disbursement | Disbursement module — release sanctioned loans |
| collection | Collection module — record payments |
| admin | Full access — all modules + overview |

**Both frontend (route guards) and backend (middleware) enforce RBAC.**
- Unauthorized API → `403 Forbidden`
- Unauthenticated API → `401 Unauthorized`

---

## 📐 REST API

### Auth
```
POST   /api/auth/register      — Create borrower account
POST   /api/auth/login         — Login (any role)
GET    /api/auth/me            — Get current user
```

### Loans
```
POST   /api/loans/check-eligibility    — BRE check (borrower)
POST   /api/loans/upload-salary-slip   — Upload document (borrower)
POST   /api/loans/apply                — Submit application (borrower)
GET    /api/loans/my-loans             — Borrower's own loans
GET    /api/loans                      — All loans (executives, filtered by role)
GET    /api/loans/:id                  — Single loan detail
PATCH  /api/loans/:id/sanction         — Approve or reject (sanction/admin)
PATCH  /api/loans/:id/disburse         — Release funds (disbursement/admin)
```

### Payments
```
POST   /api/payments                   — Record payment (collection/admin)
GET    /api/payments/loan/:loanId      — Payment history for a loan
```

### Users
```
GET    /api/users/leads                — Borrower leads (sales/admin)
```

### Admin
```
GET    /api/admin/stats                — System statistics (admin)
```

---

## 💡 Business Rule Engine (BRE)

The BRE runs **server-side only** (in `/api/loans/check-eligibility` and `/api/loans/apply`) to prevent client-side bypass.

| Rule | Condition |
|------|-----------|
| Age | Must be 23–50 years |
| Salary | ≥ ₹25,000/month |
| PAN | Valid format: `[A-Z]{5}[0-9]{4}[A-Z]{1}` |
| Employment | Not Unemployed |

---

## 📊 Loan Math

```
SI = (P × R × T) / (365 × 100)
Total Repayment = P + SI

Where:
  P = Principal (₹50,000 – ₹5,00,000)
  R = 12% per annum
  T = Tenure in days (30–365)
```

---

## 📁 Project Structure

```
lms/
├── backend/
│   ├── src/
│   │   ├── models/         # Mongoose schemas (User, Loan, Payment)
│   │   ├── routes/         # Express route handlers
│   │   ├── middleware/      # auth.ts (JWT), upload.ts (multer)
│   │   ├── utils/          # bre.ts (eligibility), jwt.ts
│   │   ├── seed.ts         # Seed all role accounts
│   │   └── index.ts        # Express app entry point
│   ├── uploads/            # Salary slip files
│   └── .env.example
│
└── frontend/
    ├── app/
    │   ├── auth/           # login, register pages
    │   ├── borrower/       # apply (multi-step), loans (portal)
    │   ├── dashboard/      # sales, sanction, disbursement, collection
    │   └── page.tsx        # Root redirect
    ├── lib/
    │   ├── api.ts          # Axios client with auth interceptor
    │   └── utils.ts        # Loan calc, formatting helpers
    ├── store/
    │   └── authStore.ts    # Zustand auth state
    └── .env.example
```

---

## 🧪 Test Flow (End-to-End)

1. **Register** as borrower → get redirected to apply
2. **Step 1** — Auth confirmed automatically
3. **Step 2** — Fill personal details → BRE check runs
   - Try invalid PAN, age < 23, salary < 25k, unemployed → see errors
   - Use valid data → proceed
4. **Step 3** — Upload salary slip (PDF/JPG/PNG, max 5MB)
5. **Step 4** — Configure loan with sliders → live calculation → Apply
6. **Login as Sanction** → review application → Approve or Reject
7. **Login as Disbursement** → disburse the sanctioned loan
8. **Login as Collection** → record payments with unique UTRs → loan auto-closes when fully paid
9. **Login as Admin** → view all modules + overview stats
10. **Login as Sales** → see all registered borrowers + who hasn't applied

---

## 🔒 Security Notes

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens expire in 7 days
- File uploads validated by MIME type + 5MB limit
- All sensitive routes protected by `authenticate` middleware
- RBAC enforced on every protected endpoint
- BRE runs server-side (cannot be bypassed on client)
