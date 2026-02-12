/**
 * Type definition for encrypted transaction record
 * 
 * This structure stores all components needed for AES-256-GCM envelope encryption:
 * 
 * Envelope Encryption Components:
 * 1. Encrypted payload (nonce + ciphertext + auth tag)
 * 2. Wrapped DEK (nonce + encrypted DEK + auth tag)
 * 3. Metadata (transaction ID, party ID, timestamps)
 * 
 * All cryptographic values are stored as hexadecimal strings for:
 * - Safe JSON serialization
 * - Database compatibility
 * - Easy transmission over HTTP
 * - Human readability (for debugging)
 * 
 * Security Properties:
 * - No plaintext data stored (only encrypted form)
 * - Authentication tags ensure integrity
 * - Unique nonces prevent replay attacks
 * - DEK never stored in plaintext (always wrapped)
 */
export type TxSecureRecord = {
  // === Transaction Metadata ===
  id: string;              // Unique transaction ID (UUID v4)
  partyId: string;         // Customer/party identifier
  createdAt: string;       // ISO 8601 timestamp (e.g., "2026-02-12T10:30:00.000Z")

  // === Encrypted Payload Components (all hex-encoded) ===
  payload_nonce: string;   // Random nonce for payload encryption (12 bytes = 24 hex chars)
  payload_ct: string;      // Encrypted payload ciphertext (variable length, hex)
  payload_tag: string;     // GCM authentication tag for payload (16 bytes = 32 hex chars)

  // === Wrapped DEK Components (all hex-encoded) ===
  dek_wrap_nonce: string;  // Random nonce for DEK wrapping (12 bytes = 24 hex chars)
  dek_wrapped: string;     // Encrypted DEK ciphertext (32 bytes = 64 hex chars)
  dek_wrap_tag: string;    // GCM authentication tag for wrapped DEK (16 bytes = 32 hex chars)

  // === Encryption Algorithm Metadata ===
  alg: "AES-256-GCM";      // Encryption algorithm identifier
  mk_version: 1;           // Master key version (for key rotation tracking)
};
