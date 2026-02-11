/**
 * Type definition for encrypted transaction record
 * Following AES-256-GCM Envelope Encryption pattern
 */
export type TxSecureRecord = {
  // Metadata
  id: string;
  partyId: string;
  createdAt: string;

  // Encrypted payload fields (all hex strings)
  payload_nonce: string;    // 12 bytes (24 hex chars)
  payload_ct: string;       // variable length
  payload_tag: string;      // 16 bytes (32 hex chars)

  // DEK wrapping fields (all hex strings)
  dek_wrap_nonce: string;   // 12 bytes (24 hex chars)
  dek_wrapped: string;      // 32 bytes encrypted (64 hex chars)
  dek_wrap_tag: string;     // 16 bytes (32 hex chars)

  // Encryption metadata
  alg: "AES-256-GCM";
  mk_version: 1;
};
