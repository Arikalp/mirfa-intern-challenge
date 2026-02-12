/**
 * Crypto Package - Envelope Encryption Implementation
 * 
 * Implements AES-256-GCM envelope encryption pattern for secure transaction storage.
 * 
 * Envelope Encryption Flow:
 * 1. Generate random Data Encryption Key (DEK) - 32 bytes
 * 2. Encrypt payload with DEK using AES-256-GCM
 * 3. Wrap (encrypt) DEK with Master Key using AES-256-GCM
 * 4. Store encrypted payload + wrapped DEK + all nonces/tags
 * 
 * Decryption Flow:
 * 1. Unwrap (decrypt) DEK using Master Key
 * 2. Decrypt payload using unwrapped DEK
 * 3. Return original payload
 * 
 * Security Features:
 * - AES-256-GCM authenticated encryption (confidentiality + integrity)
 * - Random nonces for each encryption operation (prevents replay attacks)
 * - Authentication tags ensure data hasn't been tampered with
 * - Master key never directly encrypts user data (key rotation friendly)
 */

import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import { randomUUID } from "crypto";
import { TxSecureRecord } from "./types";

/**
 * Load and validate Master Key from environment
 * 
 * The master key must be:
 * - Stored as hexadecimal string in MASTER_KEY_HEX environment variable
 * - Exactly 32 bytes (64 hex characters) for AES-256
 * - Kept secret and never committed to version control
 * 
 * @returns 32-byte master key buffer
 * @throws Error if master key is missing, invalid, or wrong length
 */
function getMasterKey(): Buffer {
  const masterKeyHex = process.env.MASTER_KEY_HEX;

  if (!masterKeyHex) {
    throw new Error("MASTER_KEY_HEX environment variable is missing");
  }

  // Validate hex format
  if (!/^[0-9a-fA-F]+$/.test(masterKeyHex)) {
    throw new Error("MASTER_KEY_HEX must be a valid hex string");
  }

  const masterKey = Buffer.from(masterKeyHex, "hex");

  if (masterKey.length !== 32) {
    throw new Error(
      `MASTER_KEY_HEX must decode to exactly 32 bytes, got ${masterKey.length} bytes`
    );
  }

  return masterKey;
}

/**
 * Validate hex string format and byte length
 * 
 * Ensures that:
 * - String contains only valid hexadecimal characters (0-9, a-f, A-F)
 * - When decoded from hex, the buffer has the expected byte length
 * 
 * @param hex - Hexadecimal string to validate
 * @param expectedBytes - Expected number of bytes after hex decoding
 * @param fieldName - Name of field being validated (for error messages)
 * @throws Error if validation fails
 */
function validateHex(hex: string, expectedBytes: number, fieldName: string): void {
  if (!/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error(`${fieldName} must be a valid hex string`);
  }

  const buffer = Buffer.from(hex, "hex");
  if (buffer.length !== expectedBytes) {
    throw new Error(
      `${fieldName} must be ${expectedBytes} bytes, got ${buffer.length} bytes`
    );
  }
}

/**
 * Encrypt payload using AES-256-GCM envelope encryption
 * 
 * This function implements the encryption side of envelope encryption:
 * 1. Generates a random Data Encryption Key (DEK)
 * 2. Encrypts the payload with the DEK
 * 3. Wraps (encrypts) the DEK with the Master Key
 * 4. Returns all encrypted components
 * 
 * Why envelope encryption?
 * - Master key never directly encrypts user data
 * - Each record has its own unique DEK
 * - Easier key rotation (only re-encrypt DEKs, not all data)
 * - Better performance for large datasets
 * 
 * @param partyId - Party identifier (customer/user ID)
 * @param payload - JSON object to encrypt (any valid JSON object)
 * @returns TxSecureRecord containing encrypted payload and wrapped DEK
 */
export function encryptEnvelope(partyId: string, payload: object): TxSecureRecord {
  // Load and validate master key from environment
  const masterKey = getMasterKey();

  // Step 1: Generate random DEK (32 bytes for AES-256)
  // Each transaction gets its own unique encryption key
  const dek = randomBytes(32);

  // Step 2: Encrypt payload using DEK with AES-256-GCM
  // Convert payload to JSON string, then to buffer
  const payloadJson = JSON.stringify(payload);
  const payloadBuffer = Buffer.from(payloadJson, "utf8");
  
  // Generate random nonce (12 bytes = 96 bits, recommended for GCM)
  const payloadNonce = randomBytes(12);

  // Create cipher and encrypt payload
  const payloadCipher = createCipheriv("aes-256-gcm", dek, payloadNonce);
  const payloadCt = Buffer.concat([
    payloadCipher.update(payloadBuffer),
    payloadCipher.final(),
  ]);
  
  // Get authentication tag (16 bytes = 128 bits)
  // This ensures data integrity - any tampering will be detected during decryption
  const payloadTag = payloadCipher.getAuthTag();

  // Step 3: Wrap (encrypt) DEK using Master Key with AES-256-GCM
  // IMPORTANT: Use a NEW random nonce (never reuse nonces with the same key)
  const dekWrapNonce = randomBytes(12);

  // Encrypt the DEK itself using the master key
  const dekCipher = createCipheriv("aes-256-gcm", masterKey, dekWrapNonce);
  const dekWrapped = Buffer.concat([
    dekCipher.update(dek),
    dekCipher.final(),
  ]);
  
  // Get authentication tag for wrapped DEK
  const dekWrapTag = dekCipher.getAuthTag();

  // Step 4: Convert all binary buffers to hex strings for storage/transmission
  // Hex encoding is safe for JSON and databases, unlike raw binary data
  const record: TxSecureRecord = {
    // Metadata
    id: randomUUID(),                           // Unique transaction identifier
    partyId,                                    // Customer/party identifier
    createdAt: new Date().toISOString(),       // ISO 8601 timestamp

    // Encrypted payload components (all in hex)
    payload_nonce: payloadNonce.toString("hex"),  // 12 bytes → 24 hex chars
    payload_ct: payloadCt.toString("hex"),        // Variable length ciphertext
    payload_tag: payloadTag.toString("hex"),      // 16 bytes → 32 hex chars

    // Wrapped DEK components (all in hex)
    dek_wrap_nonce: dekWrapNonce.toString("hex"), // 12 bytes → 24 hex chars
    dek_wrapped: dekWrapped.toString("hex"),      // 32 bytes → 64 hex chars
    dek_wrap_tag: dekWrapTag.toString("hex"),     // 16 bytes → 32 hex chars

    // Encryption metadata
    alg: "AES-256-GCM",                          // Encryption algorithm used
    mk_version: 1,                               // Master key version (for rotation)
  };

  return record;
}

/**
 * Decrypt a TxSecureRecord back to original payload
 * 
 * This function implements the decryption side of envelope encryption:
 * 1. Validates all encrypted components
 * 2. Unwraps (decrypts) the DEK using the Master Key
 * 3. Decrypts the payload using the unwrapped DEK
 * 4. Returns the original JSON payload
 * 
 * Security checks:
 * - Validates hex encoding of all fields
 * - Verifies authentication tags (prevents tampering)
 * - Fails fast on any validation or decryption error
 * 
 * @param record - Encrypted transaction record to decrypt
 * @returns Original payload object (as JSON)
 * @throws Error if validation fails, keys are wrong, or data is tampered
 */
export function decryptEnvelope(record: TxSecureRecord): object {
  // Load and validate master key from environment
  const masterKey = getMasterKey();

  // Step 1: Validate all hex fields have correct format and lengths
  try {
    validateHex(record.payload_nonce, 12, "payload_nonce");
    validateHex(record.payload_tag, 16, "payload_tag");
    validateHex(record.dek_wrap_nonce, 12, "dek_wrap_nonce");
    validateHex(record.dek_wrapped, 32, "dek_wrapped");
    validateHex(record.dek_wrap_tag, 16, "dek_wrap_tag");

    // payload_ct can be variable length, just validate it's hex
    if (!/^[0-9a-fA-F]+$/.test(record.payload_ct)) {
      throw new Error("payload_ct must be a valid hex string");
    }
  } catch (error) {
    throw new Error(`Validation failed: ${(error as Error).message}`);
  }

  // Step 2: Unwrap (decrypt) DEK using Master Key
  // Convert hex strings back to binary buffers
  const dekWrapNonce = Buffer.from(record.dek_wrap_nonce, "hex");
  const dekWrapped = Buffer.from(record.dek_wrapped, "hex");
  const dekWrapTag = Buffer.from(record.dek_wrap_tag, "hex");

  let dek: Buffer;
  try {
    // Create decipher for DEK unwrapping
    const dekDecipher = createDecipheriv("aes-256-gcm", masterKey, dekWrapNonce);
    
    // Set authentication tag - decryption will fail if tag doesn't match
    // This detects tampering or use of wrong master key
    dekDecipher.setAuthTag(dekWrapTag);
    
    // Decrypt wrapped DEK to get original DEK
    dek = Buffer.concat([
      dekDecipher.update(dekWrapped),
      dekDecipher.final(),
    ]);
  } catch (error) {
    // Authentication tag verification failed - data was tampered or wrong key
    throw new Error("DEK unwrapping failed: invalid auth tag or tampered data");
  }

  // Step 3: Decrypt payload using unwrapped DEK
  // Convert hex strings back to binary buffers
  const payloadNonce = Buffer.from(record.payload_nonce, "hex");
  const payloadCt = Buffer.from(record.payload_ct, "hex");
  const payloadTag = Buffer.from(record.payload_tag, "hex");

  let payloadBuffer: Buffer;
  try {
    // Create decipher for payload decryption
    const payloadDecipher = createDecipheriv("aes-256-gcm", dek, payloadNonce);
    
    // Set authentication tag - decryption will fail if tag doesn't match
    // This detects tampering of the encrypted payload
    payloadDecipher.setAuthTag(payloadTag);
    
    // Decrypt ciphertext to get original payload
    payloadBuffer = Buffer.concat([
      payloadDecipher.update(payloadCt),
      payloadDecipher.final(),
    ]);
  } catch (error) {
    // Authentication tag verification failed - payload was tampered
    throw new Error("Payload decryption failed: invalid auth tag or tampered ciphertext");
  }

  // Step 4: Parse decrypted buffer as JSON and return
  try {
    // Convert buffer back to UTF-8 string
    const payloadJson = payloadBuffer.toString("utf8");
    
    // Parse JSON string to object
    return JSON.parse(payloadJson);
  } catch (error) {
    // JSON parsing failed - corrupted data
    throw new Error("Failed to parse decrypted payload as JSON");
  }
}

export type { TxSecureRecord };
