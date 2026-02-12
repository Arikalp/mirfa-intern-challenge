/**
 * Encryption Tests
 * 
 * Tests verify that the AES-256-GCM envelope encryption implementation
 * correctly handles encryption, decryption, and validation scenarios.
 */

import { encryptEnvelope, decryptEnvelope, TxSecureRecord } from "../src/index";

// Set test master key
process.env.MASTER_KEY_HEX = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("Envelope Encryption Tests", () => {
  
  // Test 1: Basic encrypt → decrypt works
  test("should encrypt and decrypt payload successfully", () => {
    const partyId = "party_test_123";
    const payload = { amount: 100, currency: "AED" };

    // Encrypt
    const encrypted = encryptEnvelope(partyId, payload);
    
    // Verify encrypted record structure
    expect(encrypted).toHaveProperty("id");
    expect(encrypted).toHaveProperty("partyId", partyId);
    expect(encrypted).toHaveProperty("payload_nonce");
    expect(encrypted).toHaveProperty("payload_ct");
    expect(encrypted).toHaveProperty("payload_tag");
    expect(encrypted).toHaveProperty("dek_wrapped");
    expect(encrypted.alg).toBe("AES-256-GCM");
    expect(encrypted.mk_version).toBe(1);

    // Decrypt
    const decrypted = decryptEnvelope(encrypted);
    
    // Verify original payload is recovered
    expect(decrypted).toEqual(payload);
  });

  // Test 2: Tampered ciphertext fails
  test("should reject tampered payload ciphertext", () => {
    const partyId = "party_test_456";
    const payload = { amount: 200, currency: "USD" };

    // Encrypt
    const encrypted = encryptEnvelope(partyId, payload);
    
    // Tamper with ciphertext (flip a bit)
    const tamperedCt = encrypted.payload_ct.substring(0, 10) + "ff" + encrypted.payload_ct.substring(12);
    const tampered: TxSecureRecord = {
      ...encrypted,
      payload_ct: tamperedCt,
    };

    // Should fail decryption
    expect(() => decryptEnvelope(tampered)).toThrow();
  });

  // Test 3: Tampered authentication tag fails
  test("should reject tampered authentication tag", () => {
    const partyId = "party_test_789";
    const payload = { amount: 300, currency: "EUR" };

    // Encrypt
    const encrypted = encryptEnvelope(partyId, payload);
    
    // Tamper with auth tag
    const tamperedTag = "ffffffffffffffffffffffffffffffff"; // Invalid tag
    const tampered: TxSecureRecord = {
      ...encrypted,
      payload_tag: tamperedTag,
    };

    // Should fail decryption
    expect(() => decryptEnvelope(tampered)).toThrow("Payload decryption failed");
  });

  // Test 4: Wrong nonce length fails validation
  test("should reject invalid nonce length", () => {
    const partyId = "party_test_000";
    const payload = { amount: 400, currency: "GBP" };

    // Encrypt
    const encrypted = encryptEnvelope(partyId, payload);
    
    // Use wrong nonce length (10 bytes instead of 12)
    const invalidNonce = "0123456789abcdef0123"; // 10 bytes = 20 hex chars
    const invalid: TxSecureRecord = {
      ...encrypted,
      payload_nonce: invalidNonce,
    };

    // Should fail validation
    expect(() => decryptEnvelope(invalid)).toThrow("payload_nonce must be 12 bytes");
  });

  // Test 5: Wrong tag length fails validation
  test("should reject invalid tag length", () => {
    const partyId = "party_test_111";
    const payload = { amount: 500, currency: "JPY" };

    // Encrypt
    const encrypted = encryptEnvelope(partyId, payload);
    
    // Use wrong tag length (14 bytes instead of 16)
    const invalidTag = "0123456789abcdef0123456789"; // 14 bytes = 28 hex chars
    const invalid: TxSecureRecord = {
      ...encrypted,
      payload_tag: invalidTag,
    };

    // Should fail validation
    expect(() => decryptEnvelope(invalid)).toThrow("payload_tag must be 16 bytes");
  });

  // Test 6: Invalid hex format fails
  test("should reject non-hex characters in encrypted fields", () => {
    const partyId = "party_test_222";
    const payload = { amount: 600, currency: "AUD" };

    // Encrypt
    const encrypted = encryptEnvelope(partyId, payload);
    
    // Use invalid hex (contains 'g' which is not a hex character)
    const invalidHex: TxSecureRecord = {
      ...encrypted,
      payload_nonce: "gh123456789abcdef0123", // Invalid hex
    };

    // Should fail validation
    expect(() => decryptEnvelope(invalidHex)).toThrow("must be a valid hex string");
  });

  // Test 7: Different payloads produce different ciphertexts
  test("should produce different ciphertexts for different payloads", () => {
    const partyId = "party_test_333";
    const payload1 = { amount: 100, currency: "AED" };
    const payload2 = { amount: 200, currency: "USD" };

    const encrypted1 = encryptEnvelope(partyId, payload1);
    const encrypted2 = encryptEnvelope(partyId, payload2);

    // Ciphertexts should be different
    expect(encrypted1.payload_ct).not.toBe(encrypted2.payload_ct);
    
    // But both should decrypt correctly
    expect(decryptEnvelope(encrypted1)).toEqual(payload1);
    expect(decryptEnvelope(encrypted2)).toEqual(payload2);
  });

  // Test 8: Nonces are unique for each encryption
  test("should generate unique nonces for each encryption", () => {
    const partyId = "party_test_444";
    const payload = { amount: 700, currency: "CAD" };

    const encrypted1 = encryptEnvelope(partyId, payload);
    const encrypted2 = encryptEnvelope(partyId, payload);

    // Same payload, but nonces should be different (prevents replay attacks)
    expect(encrypted1.payload_nonce).not.toBe(encrypted2.payload_nonce);
    expect(encrypted1.dek_wrap_nonce).not.toBe(encrypted2.dek_wrap_nonce);
  });

  // Test 9: Complex nested payloads work correctly
  test("should handle complex nested JSON payloads", () => {
    const partyId = "party_test_555";
    const payload = {
      transaction: {
        amount: 1000,
        currency: "AED",
        metadata: {
          source: "web",
          ip: "192.168.1.1",
          tags: ["urgent", "verified"]
        }
      },
      timestamp: new Date().toISOString()
    };

    const encrypted = encryptEnvelope(partyId, payload);
    const decrypted = decryptEnvelope(encrypted);

    expect(decrypted).toEqual(payload);
  });

  // Test 10: Empty payload is handled correctly
  test("should handle empty object payload", () => {
    const partyId = "party_test_666";
    const payload = {};

    const encrypted = encryptEnvelope(partyId, payload);
    const decrypted = decryptEnvelope(encrypted);

    expect(decrypted).toEqual(payload);
  });
});
