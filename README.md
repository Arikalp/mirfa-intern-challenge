# 🔐 Secure Transactions Mini-App

A production-ready TurboRepo monorepo implementing AES-256-GCM envelope encryption for secure transaction storage.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-4.25-green)](https://www.fastify.io/)

## 🚀 Live Demo

- **Frontend**: [https://securo.vercel.app](https://securo.vercel.app)
- **API**: [https://mirfa-backend.vercel.app](https://mirfa-backend.vercel.app)
- **Video Walkthrough**: [Loom Video](https://loom.com/your-video-link) _(Add your recording)_

---

## 📁 Project Structure

```
mirfa-intern-challenge/
├── apps/
│   ├── api/              # Fastify REST API
│   │   ├── prisma/       # Database schema
│   │   ├── src/          # API source code
│   │   └── api/          # Vercel serverless handler
│   └── web/              # Next.js frontend
│       ├── app/          # App router pages
│       └── components/   # React components
├── packages/
│   └── crypto/           # Shared encryption library
│       ├── src/          # Envelope encryption logic
│       └── tests/        # Comprehensive test suite
└── turbo.json            # TurboRepo configuration
```

---

## 🏗️ Architecture

### Monorepo Structure
Built with **TurboRepo** for efficient build caching and task orchestration across the workspace.

### Tech Stack
- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS
- **Backend**: Fastify, Prisma ORM, PostgreSQL (Supabase)
- **Encryption**: Node.js crypto module (AES-256-GCM)
- **Deployment**: Vercel (serverless functions)
- **Package Manager**: pnpm with workspace protocol

---

## 🔐 Security Implementation

### Envelope Encryption Pattern

Implements industry-standard **envelope encryption** using AES-256-GCM:

1. **Data Encryption Key (DEK)**
   - Random 32-byte key generated per transaction
   - Encrypts the actual payload using AES-256-GCM
   - Provides data confidentiality

2. **Master Key Encryption**
   - DEK is wrapped (encrypted) with the master key
   - Master key never directly encrypts user data
   - Enables key rotation without re-encrypting all data

3. **Authentication Tags**
   - GCM mode provides authenticated encryption
   - Detects tampering or corruption
   - Ensures data integrity

### Security Features
- ✅ Random nonces prevent replay attacks
- ✅ Authentication tags ensure data integrity
- ✅ Separate DEK per transaction limits exposure
- ✅ Master key stored securely in environment variables
- ✅ Hex encoding for safe storage/transmission

---

## 🚦 Getting Started

### Prerequisites
- Node.js 20+
- pnpm 8+
- PostgreSQL database (or use Supabase)

### Installation

```bash
# Clone repository
git clone https://github.com/Arikalp/mirfa-intern-challenge.git
cd mirfa-intern-challenge

# Install dependencies
pnpm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your credentials

# Generate Prisma client
cd apps/api
pnpm db:generate

# Run database migrations
pnpm db:push
```

### Development

```bash
# Run all apps in development mode
pnpm dev

# Run specific app
pnpm dev --filter=api
pnpm dev --filter=web

# Build all packages
pnpm build

# Run tests
cd packages/crypto
pnpm test
```

**Local URLs:**
- Frontend: http://localhost:3000
- API: http://localhost:3001

---

## 🧪 Testing

Comprehensive test suite with 10+ tests covering:

```bash
cd packages/crypto
pnpm test
```

**Test Coverage:**
- ✅ Encrypt → decrypt roundtrip
- ✅ Tampered ciphertext rejection
- ✅ Tampered authentication tag rejection
- ✅ Invalid nonce length validation
- ✅ Invalid tag length validation
- ✅ Non-hex character rejection
- ✅ Unique nonce generation
- ✅ Complex nested payload handling
- ✅ Edge case scenarios

---

## 📡 API Endpoints

### Base URL
- **Production**: `https://mirfa-backend.vercel.app`
- **Local**: `http://localhost:3001`

### Endpoints

#### `GET /health`
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-02-12T12:00:00.000Z"
}
```

#### `POST /tx/encrypt`
Encrypt and store a transaction

**Request:**
```json
{
  "partyId": "party_123",
  "payload": {
    "amount": 100,
    "currency": "AED"
  }
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Transaction encrypted and stored successfully"
}
```

#### `GET /tx/:id`
Retrieve encrypted transaction (without decryption)

**Response:** TxSecureRecord with all encrypted fields

#### `POST /tx/:id/decrypt`
Decrypt transaction and return original payload

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "partyId": "party_123",
  "createdAt": "2026-02-12T12:00:00.000Z",
  "payload": {
    "amount": 100,
    "currency": "AED"
  }
}
```

---

## 🚀 Deployment

### Backend (Fastify API)

Deployed to Vercel as serverless functions.

**Configuration:**
- Root Directory: `apps/api`
- Build Command: Custom (via package.json)
- Environment Variables:
  - `MASTER_KEY_HEX` - 64-character hex string (32 bytes)
  - `DATABASE_URL` - PostgreSQL connection string

### Frontend (Next.js)

Deployed to Vercel with static generation.

**Configuration:**
- Root Directory: `apps/web`
- Framework: Next.js (auto-detected)
- Environment Variables:
  - `NEXT_PUBLIC_API_URL` - Backend API URL

---

## 🔑 Environment Variables

### API (.env)
```bash
# Master encryption key (32 bytes = 64 hex characters)
MASTER_KEY_HEX=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Database connection
DATABASE_URL=postgresql://user:password@host:5432/database

# Server configuration
PORT=3001
HOST=0.0.0.0
```

### Web (.env.local)
```bash
# API endpoint
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 📊 Data Model

### TxSecureRecord
```typescript
{
  id: string                    // UUID v4
  partyId: string               // Customer identifier
  createdAt: string             // ISO 8601 timestamp
  
  // Encrypted payload components
  payload_nonce: string         // 12 bytes (24 hex chars)
  payload_ct: string            // Variable length ciphertext
  payload_tag: string           // 16 bytes (32 hex chars)
  
  // Wrapped DEK components
  dek_wrap_nonce: string        // 12 bytes (24 hex chars)
  dek_wrapped: string           // 32 bytes (64 hex chars)
  dek_wrap_tag: string          // 16 bytes (32 hex chars)
  
  // Metadata
  alg: "AES-256-GCM"
  mk_version: 1
}
```

---

## 🛠️ Development Workflow

### TurboRepo Tasks

```bash
pnpm build      # Build all packages with caching
pnpm dev        # Run all apps in development
pnpm lint       # Lint all packages
pnpm clean      # Clean build outputs
```

### Prisma Commands

```bash
cd apps/api
pnpm db:generate  # Generate Prisma client
pnpm db:migrate   # Run migrations (dev)
pnpm db:push      # Push schema to database
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: `MASTER_KEY_HEX environment variable is missing`
- Ensure `.env` file exists in `apps/api/`
- Key must be exactly 64 hex characters

**Issue**: Database connection fails
- Check `DATABASE_URL` is correct
- Ensure database is accessible
- Verify Prisma schema is generated

**Issue**: Module `@repo/crypto` not found
- Run `pnpm install` from workspace root
- Build crypto package: `pnpm build --filter=crypto`

---

## 📚 Additional Resources

- [Challenge Requirements](./Project%20req/Challenge%20problem.md)
- [Evaluation Criteria](./Project%20req/EVALUATION.md)
- [Submission Guidelines](./Project%20req/SUBMISSION.md)

---

## 📝 License

MIT License - see LICENSE file for details

---

## 👤 Author

**Sankalp Saini**
- GitHub: [@Arikalp](https://github.com/Arikalp)
- Challenge: Mirfa Software Engineer Intern Position

---

**Built with ❤️ using TurboRepo, Next.js, and Fastify**
