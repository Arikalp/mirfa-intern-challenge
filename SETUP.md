# 🚀 Quick Start Guide

This is a complete Secure Transactions Mini-App using TurboRepo, Fastify, Next.js, and AES-256-GCM Envelope Encryption.

## 📁 Project Structure

```
mirfa-intern-challenge/
├── apps/
│   ├── api/              → Fastify backend (port 3001)
│   └── web/my-app/       → Next.js frontend (port 5000)
├── packages/
│   └── crypto/           → Shared encryption logic (AES-256-GCM)
├── turbo.json            → TurboRepo pipeline config
├── package.json          → Root workspace config
└── pnpm-workspace.yaml   → pnpm workspace config
```

## 🛠️ Installation & Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Environment Variables

**For API (apps/api):**

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` and set your master key (64 hex characters = 32 bytes):

```env
MASTER_KEY_HEX=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
PORT=3001
```

**For Web (apps/web/my-app):**

```bash
cp apps/web/my-app/.env.local.example apps/web/my-app/.env.local
```

Edit `apps/web/my-app/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Run Development Servers

```bash
pnpm dev
```

This will start:
- API server at http://localhost:3001
- Web app at http://localhost:5000

## 🔐 How It Works

### Envelope Encryption Flow

1. **Encrypt** (POST /tx/encrypt):
   - Generate random DEK (Data Encryption Key) - 32 bytes
   - Encrypt payload with DEK using AES-256-GCM
   - Wrap DEK with Master Key using AES-256-GCM
   - Store encrypted record with all nonces and auth tags

2. **Fetch** (GET /tx/:id):
   - Return encrypted record (no decryption)
   - Shows all encrypted fields as hex strings

3. **Decrypt** (POST /tx/:id/decrypt):
   - Unwrap DEK using Master Key
   - Decrypt payload using unwrapped DEK
   - Return original JSON payload

### Security Features

- ✅ AES-256-GCM authenticated encryption
- ✅ Random 12-byte nonces for each encryption
- ✅ 16-byte authentication tags prevent tampering
- ✅ Master key loaded from environment (never hardcoded)
- ✅ DEK never stored in plaintext
- ✅ Payload never stored in plaintext
- ✅ Fail-fast validation on all inputs

## 📦 Package Details

### `@repo/crypto` (packages/crypto)

**Exports:**
- `TxSecureRecord` - TypeScript type for encrypted records
- `encryptEnvelope(partyId, payload)` - Encrypts and returns record
- `decryptEnvelope(record)` - Decrypts and returns payload

**Rules:**
- NO Fastify or Next.js imports
- ONLY Node.js built-in `crypto`
- All binary data as hex strings
- Throws errors on invalid input

### `@repo/api` (apps/api)

**Routes:**
- `POST /tx/encrypt` - Encrypt & store transaction
- `GET /tx/:id` - Get encrypted record
- `POST /tx/:id/decrypt` - Decrypt transaction
- `GET /health` - Health check

**Storage:**
- In-memory Map<string, TxSecureRecord>

### Web App (apps/web/my-app)

**Features:**
- Single page UI with form inputs
- Party ID input
- JSON payload textarea
- Three action buttons (Encrypt, Fetch, Decrypt)
- Result display
- Error handling

## 🧪 Testing the App

1. Open http://localhost:5000
2. Enter a Party ID (e.g., `party_123`)
3. Edit the JSON payload (e.g., `{"amount": 100, "currency": "AED"}`)
4. Click **🔒 Encrypt & Save** - Note the transaction ID generated
5. Click **📦 Fetch Record** - See the encrypted fields (hex strings)
6. Click **🔓 Decrypt Record** - See the original payload

## 🚀 Production Build

```bash
pnpm build
```

## 🌐 Deployment

### Vercel Deployment

1. Push to GitHub
2. Import in Vercel
3. Set environment variables in Vercel dashboard:
   - `MASTER_KEY_HEX` (for API)
   - `NEXT_PUBLIC_API_URL` (for Web - your deployed API URL)

## 📝 API Examples

### Encrypt Transaction

```bash
curl -X POST http://localhost:3001/tx/encrypt \
  -H "Content-Type: application/json" \
  -d '{
    "partyId": "party_123",
    "payload": {"amount": 100, "currency": "AED"}
  }'
```

Response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Transaction encrypted and stored successfully"
}
```

### Fetch Encrypted Record

```bash
curl http://localhost:3001/tx/{id}
```

### Decrypt Transaction

```bash
curl -X POST http://localhost:3001/tx/{id}/decrypt
```

## 🔧 Tech Stack

- **Monorepo:** TurboRepo + pnpm workspaces
- **Backend:** Fastify 4.x + TypeScript
- **Frontend:** Next.js 16 + React 19 + TypeScript
- **Crypto:** Node.js built-in crypto (AES-256-GCM)
- **Deployment:** Vercel

## 🎯 Key Implementation Details

1. **No external crypto libraries** - Uses only Node.js built-in `crypto`
2. **Proper envelope encryption** - DEK encrypted with Master Key
3. **All binary as hex** - Easy to store and transmit
4. **Separation of concerns** - Crypto logic isolated in shared package
5. **Type safety** - TypeScript everywhere
6. **Production-ready** - Error handling, validation, logging

## 📚 Learn More

- [AES-GCM Envelope Encryption](https://docs.aws.amazon.com/encryption-sdk/latest/developer-guide/concepts.html#envelope-encryption)
- [Node.js Crypto API](https://nodejs.org/api/crypto.html)
- [TurboRepo Documentation](https://turbo.build/repo/docs)
- [Fastify Documentation](https://fastify.dev/)
- [Next.js Documentation](https://nextjs.org/docs)

---

Built for the Mirfa Software Engineer Intern Challenge 🚀
