import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import { randomUUID } from "crypto";
import { TxSecureRecord } from "./types";

/**
 * Load and validate Master Key from environment
 * Must be exactly 32 bytes when decoded from hex
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
 * Validate hex string and expected byte length
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
 * Encrypt payload using AES-256-GCM with a random DEK
 * Then wrap the DEK using the Master Key
 * 
 * @param partyId - Party identifier
 * @param payload - JSON object to encrypt
 * @returns TxSecureRecord with all encrypted data
 */
export function encryptEnvelope(partyId: string, payload: object): TxSecureRecord {
  const masterKey = getMasterKey();

  // Step 1: Generate random DEK (32 bytes for AES-256)
  const dek = randomBytes(32);

  // Step 2: Encrypt payload using DEK with AES-256-GCM
  const payloadJson = JSON.stringify(payload);
  const payloadBuffer = Buffer.from(payloadJson, "utf8");
  const payloadNonce = randomBytes(12); // 96-bit nonce for GCM

  const payloadCipher = createCipheriv("aes-256-gcm", dek, payloadNonce);
  const payloadCt = Buffer.concat([
    payloadCipher.update(payloadBuffer),
    payloadCipher.final(),
  ]);
  const payloadTag = payloadCipher.getAuthTag(); // 16 bytes (128-bit)

  // Step 3: Wrap DEK using Master Key with AES-256-GCM
  const dekWrapNonce = randomBytes(12); // NEW nonce for DEK wrapping

  const dekCipher = createCipheriv("aes-256-gcm", masterKey, dekWrapNonce);
  const dekWrapped = Buffer.concat([
    dekCipher.update(dek),
    dekCipher.final(),
  ]);
  const dekWrapTag = dekCipher.getAuthTag(); // 16 bytes

  // Step 4: Convert all buffers to hex strings
  const record: TxSecureRecord = {
    id: randomUUID(),
    partyId,
    createdAt: new Date().toISOString(),

    payload_nonce: payloadNonce.toString("hex"),
    payload_ct: payloadCt.toString("hex"),
    payload_tag: payloadTag.toString("hex"),

    dek_wrap_nonce: dekWrapNonce.toString("hex"),
    dek_wrapped: dekWrapped.toString("hex"),
    dek_wrap_tag: dekWrapTag.toString("hex"),

    alg: "AES-256-GCM",
    mk_version: 1,
  };

  return record;
}

/**
 * Decrypt a TxSecureRecord back to original payload
 * 
 * @param record - Encrypted record to decrypt
 * @returns Original payload object
 */
export function decryptEnvelope(record: TxSecureRecord): object {
  const masterKey = getMasterKey();

  // Step 1: Validate all hex fields
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

  // Step 2: Unwrap DEK using Master Key
  const dekWrapNonce = Buffer.from(record.dek_wrap_nonce, "hex");
  const dekWrapped = Buffer.from(record.dek_wrapped, "hex");
  const dekWrapTag = Buffer.from(record.dek_wrap_tag, "hex");

  let dek: Buffer;
  try {
    const dekDecipher = createDecipheriv("aes-256-gcm", masterKey, dekWrapNonce);
    dekDecipher.setAuthTag(dekWrapTag);
    dek = Buffer.concat([
      dekDecipher.update(dekWrapped),
      dekDecipher.final(),
    ]);
  } catch (error) {
    throw new Error("DEK unwrapping failed: invalid auth tag or tampered data");
  }

  // Step 3: Decrypt payload using unwrapped DEK
  const payloadNonce = Buffer.from(record.payload_nonce, "hex");
  const payloadCt = Buffer.from(record.payload_ct, "hex");
  const payloadTag = Buffer.from(record.payload_tag, "hex");

  let payloadBuffer: Buffer;
  try {
    const payloadDecipher = createDecipheriv("aes-256-gcm", dek, payloadNonce);
    payloadDecipher.setAuthTag(payloadTag);
    payloadBuffer = Buffer.concat([
      payloadDecipher.update(payloadCt),
      payloadDecipher.final(),
    ]);
  } catch (error) {
    throw new Error("Payload decryption failed: invalid auth tag or tampered ciphertext");
  }

  // Step 4: Parse JSON and return
  try {
    const payloadJson = payloadBuffer.toString("utf8");
    return JSON.parse(payloadJson);
  } catch (error) {
    throw new Error("Failed to parse decrypted payload as JSON");
  }
}

export type { TxSecureRecord };
