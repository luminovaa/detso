# Detso - ISP Management System

> Platform SaaS Multi-tenant untuk Manajemen ISP (Internet Service Provider)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📖 Tentang Project

Detso adalah platform SaaS yang dirancang khusus untuk membantu perusahaan ISP (Internet Service Provider) di Indonesia mengelola operasional mereka secara efisien. Platform ini mendukung multi-tenant, memungkinkan banyak ISP menggunakan sistem yang sama dengan data yang terisolasi sempurna.

### Fitur Utama

- 🏢 **Multi-Tenant Architecture** - Isolasi data sempurna antar ISP
- 👥 **Customer Management** - Kelola pelanggan dengan dokumen lengkap
- 📦 **Package Management** - Atur paket internet dengan fleksibel
- 🔌 **Service Connection** - Track koneksi layanan pelanggan
- 🎫 **Ticket System** - Sistem tiket support terintegrasi
- 📅 **Work Schedule** - Jadwal kerja teknisi
- 💬 **WhatsApp Integration** - Notifikasi via WhatsApp (dalam pengembangan)
- 📊 **Dashboard** - Analytics dan reporting
- 🔐 **Role-Based Access** - 4 level akses (Super Admin, Owner, Admin, Teknisi)

## 🏗️ Arsitektur

Project ini menggunakan arsitektur monorepo dengan 3 komponen utama:

```
detso/
├── backend/          # REST API + WebSocket (Node.js + Express + TypeScript)
├── frontend/         # Web Dashboard (Next.js 15 + React 18)
└── detso-mobile/     # Mobile App untuk Teknisi (Expo + React Native)
```

### Tech Stack

#### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript 5.9
- **Database:** PostgreSQL 14+ dengan Prisma ORM
- **Authentication:** JWT + Refresh Token
- **Real-time:** Socket.IO
- **Validation:** Zod
- **Security:** Helmet, CORS, Rate Limiting
- **Logging:** Winston + Morgan

#### Frontend
- **Framework:** Next.js 15 (App Router)
- **UI Library:** React 18
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand + React Query
- **Real-time:** Socket.IO Client

#### Mobile
- **Framework:** Expo SDK 54
- **UI:** React Native + NativeWind
- **Navigation:** React Navigation
- **State Management:** Zustand + React Query
- **Maps:** Mapbox

## 🚀 Quick Start

### Prerequisites

Pastikan Anda sudah menginstall:
- Node.js 18 atau lebih tinggi
- PostgreSQL 14 atau lebih tinggi
- Yarn package manager
- Git

### Installation

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd detso
   ```

2. **Setup Backend**
   ```bash
   cd backend
   yarn install
   
   # Copy environment file
   cp .env.example .env
   
   # Edit .env dengan konfigurasi Anda
   nano .env
   
   # Setup database
   yarn prisma:migrate
   yarn prisma:seed
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   yarn install
   
   # Copy environment file
   cp .env.example .env.local
   
   # Edit .env.local dengan konfigurasi Anda
   nano .env.local
   ```

4. **Setup Mobile** (Opsional)
   ```bash
   cd ../detso-mobile
   yarn install
   
   # Copy environment file
   cp .env.example .env.development
   
   # Edit .env.development dengan konfigurasi Anda
   nano .env.development
   ```

### Running Development Servers

Buka 3 terminal terpisah:

**Terminal 1 - Backend:**
```bash
cd backend
yarn dev
# Server akan berjalan di http://localhost:6589
```

**Terminal 2 - Frontend:**
```bash
cd frontend
yarn dev
# Dashboard akan berjalan di http://localhost:3000
```

**Terminal 3 - Mobile:**
```bash
cd detso-mobile
yarn start
# Scan QR code dengan Expo Go app
```

## 📚 Dokumentasi

Dokumentasi lengkap tersedia di folder `_bmad/project-knowledge/`:

### Dokumentasi Utama
- **[Index & Navigation](_bmad/project-knowledge/index.md)** - Hub navigasi dokumentasi
- **[Domain Context](_bmad/project-knowledge/CONTEXT.md)** - Konteks bisnis dan domain
- **[Project Overview](_bmad/project-knowledge/project-overview.md)** - Overview teknis project

### Dokumentasi Backend
- **[Backend Architecture](_bmad/project-knowledge/backend-architecture.md)** - Arsitektur backend detail
- **[Domain Model](_bmad/project-knowledge/domain-model.md)** - Model data dan ERD
- **[API Catalog](_bmad/project-knowledge/api-catalog.md)** - Dokumentasi API lengkap
- **[Security Implementation](_bmad/project-knowledge/security-implementation.md)** - Implementasi keamanan
- **[Project Context](_bmad/project-knowledge/project-context.md)** - Aturan coding untuk AI

### Dokumentasi Arsitektur
- **[Solution Design](_bmad/planning-artifacts/architecture/solution-design.md)** - Desain solusi
- **[ADRs](_bmad/planning-artifacts/architecture/adr/)** - Architecture Decision Records

### Code Review
- **[Code Review Findings](_bmad/planning-artifacts/code-review-findings.md)** - Hasil review kode

## 🔐 Security

Detso mengimplementasikan multiple layers of security:

- ✅ JWT Authentication dengan Refresh Token
- ✅ Role-Based Access Control (RBAC)
- ✅ Multi-Tenant Data Isolation
- ✅ Rate Limiting (6 limiters berbeda)
- ✅ Input Validation (Zod schemas)
- ✅ File Upload Validation (5-layer validation)
- ✅ SQL Injection Prevention (Prisma ORM)
- ✅ XSS Prevention
- ✅ Security Headers (Helmet.js)
- ✅ CORS Configuration
- ✅ Comprehensive Logging

Untuk detail lengkap, lihat [Security Implementation](_bmad/project-knowledge/security-implementation.md).

## 🧪 Testing

**Status:** Testing infrastructure belum diimplementasikan

**Planned:**
- Unit Tests (Jest)
- Integration Tests (Supertest)
- E2E Tests (Playwright untuk web, Detox untuk mobile)

## 📦 Deployment

### Backend Deployment

**Development:**
```bash
cd backend
yarn dev
```

**Production:**
```bash
cd backend
yarn build
yarn start
```

**Environment Variables:**
Pastikan semua environment variables di `.env` sudah di-set dengan benar. Lihat `.env.example` untuk referensi.

### Frontend Deployment

**Development:**
```bash
cd frontend
yarn dev
```

**Production:**
```bash
cd frontend
yarn build
yarn start
```

### Mobile Deployment

**Development:**
```bash
cd detso-mobile
yarn start
```

**Build:**
```bash
# Android
yarn android

# iOS
yarn ios
```

## 🤝 Contributing

Kami menerima kontribusi! Silakan baca [CONTRIBUTING.md](CONTRIBUTING.md) untuk guidelines.

### Development Workflow

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Coding Standards

- **Language:** TypeScript untuk semua code baru
- **Style:** Ikuti existing code style
- **Validation:** Gunakan Zod untuk input validation
- **Error Handling:** Gunakan custom error classes
- **Multi-Tenant:** Selalu filter by `tenant_id`
- **Security:** Review [Security Implementation](_bmad/project-knowledge/security-implementation.md)

## 📊 Project Status

**Current Version:** 1.0.0  
**Status:** Production Ready (dengan beberapa improvement yang direncanakan)

### Completed Features
- ✅ Authentication & Authorization
- ✅ Multi-Tenant Architecture
- ✅ Customer Management
- ✅ Package Management
- ✅ Service Connection Management
- ✅ Ticket System
- ✅ Work Schedule Management
- ✅ Tenant Management
- ✅ Dashboard (Basic)
- ✅ File Upload & Management
- ✅ Real-time Communication (Socket.IO)

### In Progress
- 🚧 WhatsApp Integration (commented out, needs completion)
- 🚧 Advanced Dashboard Analytics
- 🚧 Mobile App Features

### Planned
- 📋 Testing Infrastructure
- 📋 CI/CD Pipeline
- 📋 API Documentation (Swagger/OpenAPI)
- 📋 2FA/MFA
- 📋 Advanced Reporting
- 📋 Data Export/Import
- 📋 Backup & Recovery System

## 🐛 Known Issues

Lihat [Code Review Findings](_bmad/planning-artifacts/code-review-findings.md) untuk daftar lengkap issues dan recommendations.

**Critical:**
- No 2FA/MFA implementation
- Weak password requirements (min 6 chars)
- No account lockout mechanism
- WhatsApp integration incomplete

**High:**
- No encryption at rest
- No security audit trail
- No automated security scanning
- No testing infrastructure

## 📞 Support

**Developer:** Neon Code  
**Email:** support@detso.com (jika ada)  
**Documentation:** [_bmad/project-knowledge/](_bmad/project-knowledge/)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Express.js team
- Prisma team
- Next.js team
- Expo team
- shadcn/ui
- Dan semua open source contributors

---

**Built with ❤️ by Neon Code**

**Last Updated:** 2026-04-30
