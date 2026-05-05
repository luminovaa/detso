# AGENTS.md - Detso ISP Management System

> Panduan untuk AI Agents yang bekerja dengan codebase Detso

**Last Updated:** 2026-05-05  
**Project Version:** 1.0.0  
**Target Market:** Indonesia

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Business Domain](#business-domain)
4. [Multi-Tenant Architecture](#multi-tenant-architecture)
5. [Tech Stack](#tech-stack)
6. [Project Structure](#project-structure)
7. [Documentation](#documentation)
8. [General Rules for AI Agents](#general-rules-for-ai-agents)
9. [Getting Started](#getting-started)

---

## Project Overview

**Detso** adalah platform SaaS multi-tenant untuk manajemen ISP (Internet Service Provider) di Indonesia. Platform ini memungkinkan perusahaan ISP mengelola pelanggan, paket internet, service connections, ticketing system, dan jadwal teknisi secara digital.

### Key Features

- 🏢 **Multi-Tenant Architecture** - Isolasi data sempurna antar ISP
- 👥 **Customer Management** - Kelola pelanggan dengan dokumen lengkap
- 📦 **Package Management** - Atur paket internet dengan fleksibel
- 🔌 **Service Connection** - Track koneksi layanan pelanggan
- 🎫 **Ticket System** - Sistem tiket support terintegrasi
- 📅 **Work Schedule** - Jadwal kerja teknisi
- 🗺️ **Network Topology** - Visualisasi topologi jaringan ISP
- 💬 **WhatsApp Integration** - Notifikasi via WhatsApp (dalam pengembangan)
- 📊 **Dashboard** - Analytics dan reporting
- 🔐 **Role-Based Access** - 4 level akses (Super Admin, Owner, Admin, Teknisi)

### Target Users

1. **SAAS_SUPER_ADMIN** - Platform administrator (akses semua tenant)
2. **TENANT_OWNER** - Pemilik ISP (full access dalam tenant)
3. **TENANT_ADMIN** - Admin ISP (manage operations)
4. **TENANT_TEKNISI** - Teknisi lapangan (mobile app, limited access)

---

## Architecture

Detso menggunakan **monorepo architecture** dengan 3 komponen utama:

```
detso/
├── backend/          # REST API + WebSocket (Node.js + Express + TypeScript)
├── frontend/         # Web Dashboard (Next.js 15 + React 18)
└── detso-mobile/     # Mobile App untuk Teknisi (Expo + React Native)
```

### Communication Flow

```
┌─────────────────┐         ┌─────────────────┐         ┌──────────────────┐
│   Frontend      │◄───────►│    Backend      │◄───────►│   PostgreSQL     │
│   (Next.js)     │  HTTP   │   (Express)     │  Prisma │   Database       │
└─────────────────┘         └─────────────────┘         └──────────────────┘
                                     ▲
                                     │ HTTP
                                     │
                            ┌────────┴────────┐
                            │   Mobile App    │
                            │   (Expo RN)     │
                            └─────────────────┘
```

### Real-time Communication

- **Socket.IO** untuk real-time updates
- Multi-tenant room management: `tenant:{tenant_id}`
- Events: ticket updates, schedule changes, dashboard updates

---

## Business Domain

### Core Entities

1. **Tenant** - ISP company yang menggunakan platform
2. **User** - Staff ISP (Owner, Admin, Teknisi)
3. **Customer** - Pelanggan yang berlangganan internet
4. **Package** - Paket internet yang ditawarkan
5. **Service Connection** - Koneksi internet aktif customer
6. **Ticket** - Tiket maintenance/komplain
7. **Work Schedule** - Jadwal kerja teknisi
8. **Network Node** - Node dalam topologi jaringan
9. **Network Link** - Link antar node

### Business Rules

**Multi-Tenant Isolation:**
- Setiap query HARUS filter by `tenant_id`
- User tidak bisa akses data tenant lain
- SAAS_SUPER_ADMIN exception: bisa akses semua tenant

**Authorization Hierarchy:**
```
SAAS_SUPER_ADMIN (Level 0)
    ↓
TENANT_OWNER (Level 1)
    ↓
TENANT_ADMIN (Level 2)
    ↓
TENANT_TEKNISI (Level 3)
```

**Kudeta Protection:**
- TENANT_ADMIN tidak bisa create TENANT_OWNER
- TENANT_ADMIN tidak bisa promote diri sendiri
- User tidak bisa delete diri sendiri

**Data Constraints:**
- Customer tidak bisa dihapus jika masih punya service aktif
- Package tidak bisa dihapus jika masih digunakan
- IP address harus unique dalam tenant
- MAC address harus unique dalam tenant
- NIK harus unique dalam tenant (jika diisi)

---

## Multi-Tenant Architecture

### Strategy: Shared Database, Shared Schema

```
┌─────────────────────────────────────────┐
│         PostgreSQL Database             │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Tenant A (tenant_id: xxx)      │   │
│  │  - 500 Customers                │   │
│  │  - 10 Packages                  │   │
│  │  - 5 Staff                      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Tenant B (tenant_id: yyy)      │   │
│  │  - 300 Customers                │   │
│  │  - 8 Packages                   │   │
│  │  - 3 Staff                      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Tenant C (tenant_id: zzz)      │   │
│  │  - 1000 Customers               │   │
│  │  - 15 Packages                  │   │
│  │  - 10 Staff                     │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Implementation

**Database Level:**
- Semua tabel punya kolom `tenant_id`
- Index pada `tenant_id` untuk performance
- Soft delete dengan `deleted_at`

**Application Level:**
- Middleware inject `tenant_id` dari JWT
- Prisma queries auto-filter by `tenant_id`
- Validation layer check tenant ownership

**Security Level:**
- JWT contains `tenant_id` claim
- Rate limiting per tenant
- File storage isolated per tenant

---

## Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript 5.9
- **Database:** PostgreSQL 14+ dengan Prisma ORM
- **Authentication:** JWT (Access Token + Refresh Token)
- **Real-time:** Socket.IO
- **Validation:** Zod
- **Security:** Helmet, CORS, Rate Limiting (6 limiters)
- **Logging:** Winston + Morgan
- **File Upload:** Multer dengan 5-layer validation

### Frontend
- **Framework:** Next.js 15 (App Router)
- **UI Library:** React 18
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand + React Query
- **Real-time:** Socket.IO Client
- **Forms:** React Hook Form + Zod

### Mobile
- **Framework:** Expo SDK 54
- **UI:** React Native + NativeWind (Tailwind for RN)
- **Navigation:** Expo Router (file-based routing)
- **State Management:** Zustand + React Query
- **Maps:** Mapbox (@rnmapbox/maps)
- **Camera:** React Native Vision Camera
- **Internationalization:** i18next + react-i18next

---

## Project Structure

```
detso/
├── _bmad/                      # BMad documentation & planning artifacts
│   ├── planning-artifacts/     # Architecture decisions, code reviews
│   └── project-knowledge/      # Comprehensive documentation
│       ├── CONTEXT.md          # Business domain & terminology
│       ├── backend-architecture.md
│       ├── domain-model.md
│       ├── api-catalog.md
│       ├── security-implementation.md
│       └── project-context.md  # Coding rules for AI
│
├── backend/                    # Backend API
│   ├── prisma/                 # Database schema & migrations
│   │   ├── schema.prisma       # 14 models
│   │   └── seed.ts             # Seed data
│   ├── src/
│   │   ├── app.ts              # Express app setup
│   │   ├── config/             # Configuration files
│   │   ├── controller/         # Route handlers (by domain)
│   │   │   ├── auth/
│   │   │   ├── customer/
│   │   │   ├── package/
│   │   │   ├── service-connection/
│   │   │   ├── tenant/
│   │   │   ├── ticket/
│   │   │   ├── user/
│   │   │   ├── schedule/
│   │   │   ├── dashboard/
│   │   │   └── network/
│   │   ├── middleware/         # Auth, rate limiting, validation
│   │   ├── router/             # Route registration
│   │   ├── services/           # Business logic services
│   │   └── utils/              # Utilities & helpers
│   ├── index.ts                # Entry point + Socket.IO
│   ├── package.json
│   ├── tsconfig.json
│   └── AGENTS.md               # Backend-specific AI rules
│
├── frontend/                   # Web Dashboard
│   ├── app/                    # Next.js App Router
│   ├── components/             # React components
│   ├── hooks/                  # Custom hooks
│   ├── lib/                    # Utilities
│   ├── api/                    # API client
│   ├── package.json
│   └── next.config.mjs
│
├── detso-mobile/               # Mobile App
│   ├── app/                    # Expo Router (file-based routing)
│   │   ├── (tabs)/             # Tab navigation
│   │   ├── sign-in/            # Auth screens
│   │   ├── customer/           # Customer screens
│   │   ├── package/            # Package screens
│   │   ├── service/            # Service screens
│   │   ├── ticket/             # Ticket screens
│   │   └── settings/           # Settings screens
│   ├── src/
│   │   ├── components/         # React Native components
│   │   ├── features/           # Feature modules (hooks, services, stores)
│   │   │   ├── auth/
│   │   │   ├── customer/
│   │   │   ├── package/
│   │   │   ├── ticket/
│   │   │   └── ...
│   │   ├── hooks/              # Custom hooks
│   │   ├── lib/                # Utilities & helpers
│   │   └── locales/            # i18n translations
│   ├── app.json                # Expo configuration
│   ├── package.json
│   └── AGENTS.md               # Mobile-specific AI rules
│
├── docker-compose.yml          # Docker setup
├── postgres.env                # PostgreSQL config
├── README.md                   # Project README
└── AGENTS.md                   # This file (root-level AI rules)
```

---

## Documentation

### Primary Documentation

**Location:** `_bmad/project-knowledge/`

**Essential Files:**
1. **[CONTEXT.md](_bmad/project-knowledge/CONTEXT.md)** - Business domain, terminology, workflows
2. **[backend-architecture.md](_bmad/project-knowledge/backend-architecture.md)** - Backend architecture detail
3. **[domain-model.md](_bmad/project-knowledge/domain-model.md)** - Database schema & ERD
4. **[api-catalog.md](_bmad/project-knowledge/api-catalog.md)** - Complete API documentation
5. **[security-implementation.md](_bmad/project-knowledge/security-implementation.md)** - Security patterns
6. **[project-context.md](_bmad/project-knowledge/project-context.md)** - Coding rules for AI

**Architecture Decisions:**
- Location: `_bmad/planning-artifacts/architecture/adr/`
- Format: Architecture Decision Records (ADRs)

**Code Review:**
- Location: `_bmad/planning-artifacts/code-review-findings.md`
- Contains: Known issues, recommendations, security concerns

### Component-Specific Documentation

- **Backend:** See `backend/AGENTS.md` for backend-specific rules
- **Mobile:** See `detso-mobile/AGENTS.md` for mobile-specific rules

---

## General Rules for AI Agents

### 1. Multi-Tenant Awareness

**CRITICAL:** Setiap operasi data HARUS mempertimbangkan tenant isolation.

```typescript
// ✅ CORRECT - Always filter by tenant_id
const customers = await prisma.detso_Customer.findMany({
  where: {
    tenant_id: user.tenant_id,
    deleted_at: null
  }
});

// ❌ WRONG - Missing tenant_id filter
const customers = await prisma.detso_Customer.findMany({
  where: {
    deleted_at: null
  }
});
```

**Exception:** SAAS_SUPER_ADMIN bisa akses semua tenant, tapi harus explicit.

### 2. Security First

**Always Consider:**
- Input validation (Zod schemas)
- Authorization checks (role-based)
- Rate limiting (per endpoint)
- File upload validation (type, size, content)
- SQL injection prevention (use Prisma, never raw queries)
- XSS prevention (sanitize output)

**Never:**
- Expose sensitive data in logs
- Return raw error messages to client
- Skip validation "for testing"
- Hardcode credentials
- Use `any` type in TypeScript

### 3. Error Handling

**Use Custom Error Classes:**
```typescript
import { BadRequestError, UnauthorizedError, NotFoundError } from '@/utils/error-handler';

// ✅ CORRECT
if (!customer) {
  throw new NotFoundError('Customer tidak ditemukan');
}

// ❌ WRONG
if (!customer) {
  throw new Error('Customer tidak ditemukan');
}
```

**Error Response Format:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": ["Detail 1", "Detail 2"]
}
```

### 4. Validation Patterns

**Always use Zod for validation:**
```typescript
import { z } from 'zod';

const createCustomerSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  phone: z.string().optional(),
  email: z.string().email('Email tidak valid').optional(),
  nik: z.string().length(16, 'NIK harus 16 digit').optional()
});

// Validate
const validated = createCustomerSchema.parse(req.body);
```

### 5. Database Access Patterns

**Use Prisma ORM:**
```typescript
// ✅ CORRECT - Use Prisma
const customer = await prisma.detso_Customer.create({
  data: {
    tenant_id: user.tenant_id,
    name: validated.name,
    phone: validated.phone
  }
});

// ❌ WRONG - Never use raw SQL
const customer = await prisma.$queryRaw`
  INSERT INTO detso_customers (name, phone) VALUES (${name}, ${phone})
`;
```

**Soft Delete Pattern:**
```typescript
// ✅ CORRECT - Soft delete
await prisma.detso_Customer.update({
  where: { id: customerId },
  data: { deleted_at: new Date() }
});

// ❌ WRONG - Hard delete
await prisma.detso_Customer.delete({
  where: { id: customerId }
});
```

### 6. API Response Format

**Success Response:**
```typescript
import { successResponse } from '@/utils/response-handler';

return res.json(successResponse(
  'Customer berhasil dibuat',
  customer,
  201
));
```

**Output:**
```json
{
  "success": true,
  "message": "Customer berhasil dibuat",
  "data": { ... }
}
```

### 7. Logging

**Use Winston Logger:**
```typescript
import logger from '@/config/logger.config';

// Info
logger.info('Customer created', { customerId, tenantId });

// Error
logger.error('Failed to create customer', { error, customerId });

// Warning
logger.warn('Duplicate NIK detected', { nik, tenantId });
```

**Never log:**
- Passwords
- Tokens
- Credit card numbers
- Full error stack in production

### 8. TypeScript Best Practices

**Always use types:**
```typescript
// ✅ CORRECT
interface CreateCustomerRequest {
  name: string;
  phone?: string;
  email?: string;
}

const createCustomer = async (data: CreateCustomerRequest): Promise<Customer> => {
  // ...
};

// ❌ WRONG
const createCustomer = async (data: any): Promise<any> => {
  // ...
};
```

**Use enums for constants:**
```typescript
enum UserRole {
  SAAS_SUPER_ADMIN = 'SAAS_SUPER_ADMIN',
  TENANT_OWNER = 'TENANT_OWNER',
  TENANT_ADMIN = 'TENANT_ADMIN',
  TENANT_TEKNISI = 'TENANT_TEKNISI'
}
```

### 9. File Organization

**Controller Pattern:**
```
controller/{module}/
├── index.ts                    # Route definitions
├── create.{module}.ts          # Create operations
├── get.{module}.ts             # Read operations
├── edit.{module}.ts            # Update operations
├── delete.{module}.ts          # Delete operations
└── validation/
    └── validation.{module}.ts  # Zod schemas
```

**One action per file** - Easier to maintain and test.

### 10. Testing (Future)

**When implementing tests:**
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical flows
- Mock external dependencies
- Test multi-tenant isolation
- Test authorization rules

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Yarn package manager
- Git

### Quick Start

1. **Clone & Install:**
```bash
git clone <repository-url>
cd detso

# Backend
cd backend
yarn install
cp .env.example .env
# Edit .env with your config

# Frontend
cd ../frontend
yarn install
cp .env.example .env.local

# Mobile
cd ../detso-mobile
npm install
cp .env.example .env.development
```

2. **Setup Database:**
```bash
cd backend
yarn prisma:migrate
yarn prisma:seed
```

3. **Run Development:**
```bash
# Terminal 1 - Backend
cd backend
yarn dev

# Terminal 2 - Frontend
cd frontend
yarn dev

# Terminal 3 - Mobile
cd detso-mobile
npm start
```

### Environment Variables

**Backend (.env):**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/detso
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
PORT=6589
NODE_ENV=development
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:6589
```

**Mobile (.env.development):**
```env
EXPO_PUBLIC_API_URL=http://localhost:6589
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

---

## Common Tasks for AI Agents

### Adding a New Feature

1. **Read Documentation:**
   - Check `_bmad/project-knowledge/CONTEXT.md` for business rules
   - Check `_bmad/project-knowledge/project-context.md` for coding patterns
   - Check component-specific AGENTS.md

2. **Plan:**
   - Identify affected entities
   - Check multi-tenant implications
   - Plan database changes (if any)
   - Plan API endpoints
   - Plan UI components

3. **Implement:**
   - Backend: Controller → Validation → Service → Database
   - Frontend: API client → Hook → Component
   - Mobile: Service → Hook → Screen

4. **Test:**
   - Test multi-tenant isolation
   - Test authorization rules
   - Test edge cases
   - Test error handling

### Fixing a Bug

1. **Understand:**
   - Read error logs
   - Check related code
   - Check business rules in CONTEXT.md

2. **Diagnose:**
   - Reproduce the issue
   - Identify root cause
   - Check if it affects other tenants

3. **Fix:**
   - Implement fix
   - Add validation if needed
   - Update tests

4. **Verify:**
   - Test the fix
   - Check for regressions
   - Update documentation if needed

### Refactoring Code

1. **Before:**
   - Understand current implementation
   - Check if it's used elsewhere
   - Plan the refactoring

2. **During:**
   - Keep multi-tenant rules
   - Keep security patterns
   - Keep error handling
   - Update types

3. **After:**
   - Test thoroughly
   - Update documentation
   - Check for breaking changes

---

## Important Reminders

### DO's ✅

- Always filter by `tenant_id`
- Always validate input with Zod
- Always use custom error classes
- Always use TypeScript types
- Always log important operations
- Always check authorization
- Always use Prisma (never raw SQL)
- Always soft delete (use `deleted_at`)
- Always return consistent response format
- Always read documentation first

### DON'Ts ❌

- Never skip tenant_id filter
- Never skip validation
- Never expose sensitive data
- Never use `any` type
- Never hardcode credentials
- Never use raw SQL queries
- Never hard delete data
- Never skip authorization checks
- Never log passwords/tokens
- Never assume - always verify

---

## Support & Resources

**Documentation:**
- Main docs: `_bmad/project-knowledge/`
- Backend rules: `backend/AGENTS.md`
- Mobile rules: `detso-mobile/AGENTS.md`

**Key Contacts:**
- Developer: Neon Code
- Project: Detso ISP Management System

**External Resources:**
- [Prisma Docs](https://www.prisma.io/docs)
- [Express.js Docs](https://expressjs.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [Expo Docs](https://docs.expo.dev/)
- [Zod Docs](https://zod.dev/)

---

**Last Updated:** 2026-05-05  
**Maintained by:** Neon Code  
**License:** MIT
