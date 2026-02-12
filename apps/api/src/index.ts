/**
 * Secure Transaction API Server
 * 
 * Fastify-based REST API for encrypting, storing, and decrypting transaction payloads
 * using AES-256-GCM envelope encryption pattern.
 * 
 * Endpoints:
 * - POST /tx/encrypt - Encrypt and store a transaction
 * - GET /tx/:id - Retrieve encrypted transaction record
 * - POST /tx/:id/decrypt - Decrypt and return original payload
 * - GET /health - Health check endpoint
 */

import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";
import { encryptEnvelope, decryptEnvelope, TxSecureRecord } from "@repo/crypto";

// Initialize Fastify server with logging enabled
const fastify = Fastify({
  logger: true,
});

// Enable CORS to allow frontend connections from any origin
fastify.register(cors, {
  origin: true,
});

/**
 * Prisma Client for PostgreSQL database access
 * Provides type-safe database queries for encrypted transaction records
 */
const prisma = new PrismaClient();

/**
 * POST /tx/encrypt
 * 
 * Encrypts a JSON payload using AES-256-GCM envelope encryption and stores it.
 * 
 * Request Body:
 * {
 *   "partyId": "party_123",
 *   "payload": { "amount": 100, "currency": "AED" }
 * }
 * 
 * Response:
 * {
 *   "id": "uuid-of-transaction",
 *   "message": "Transaction encrypted and stored successfully"
 * }
 * 
 * Status Codes:
 * - 200: Success
 * - 400: Invalid request (missing or invalid partyId/payload)
 * - 500: Encryption failure
 */
fastify.post<{
  Body: {
    partyId: string;
    payload: object;
  };
}>("/tx/encrypt", async (request, reply) => {
  try {
    const { partyId, payload } = request.body;

    // Validate partyId field
    if (!partyId || typeof partyId !== "string") {
      return reply.status(400).send({
        error: "partyId is required and must be a string",
      });
    }

    // Validate payload field
    if (!payload || typeof payload !== "object") {
      return reply.status(400).send({
        error: "payload is required and must be an object",
      });
    }

    // Perform envelope encryption (generates DEK, encrypts payload, wraps DEK with master key)
    const record = encryptEnvelope(partyId, payload);

    // Store encrypted record in PostgreSQL database
    await prisma.transaction.create({
      data: {
        id: record.id,
        partyId: record.partyId,
        encryptedDek: record.dek_wrapped,
        dekWrapNonce: record.dek_wrap_nonce,
        dekWrapTag: record.dek_wrap_tag,
        encryptedData: record.payload_ct,
        iv: record.payload_nonce,
        authTag: record.payload_tag,
      },
    });

    // Log successful encryption
    fastify.log.info(`Encrypted transaction ${record.id} for party ${partyId}`);

    // Return transaction ID and success message
    return {
      id: record.id,
      message: "Transaction encrypted and stored successfully",
    };
  } catch (error) {
    // Log and return encryption error
    fastify.log.error(error);
    return reply.status(500).send({
      error: "Encryption failed",
      details: (error as Error).message,
    });
  }
});

/**
 * GET /tx/:id
 * 
 * Retrieves an encrypted transaction record without decrypting it.
 * Useful for inspecting the encrypted structure or transferring encrypted data.
 * 
 * URL Parameters:
 * - id: Transaction UUID
 * 
 * Response: TxSecureRecord (encrypted form)
 * {
 *   "id": "uuid",
 *   "partyId": "party_123",
 *   "payload_nonce": "...",
 *   "payload_ct": "...",
 *   "payload_tag": "...",
 *   "dek_wrap_nonce": "...",
 *   "dek_wrapped": "...",
 *   "dek_wrap_tag": "...",
 *   "alg": "AES-256-GCM",
 *   "mk_version": 1,
 *   "createdAt": "ISO timestamp"
 * }
 * 
 * Status Codes:
 * - 200: Success
 * - 404: Transaction not found
 */
fastify.get<{
  Params: {
    id: string;
  };
}>("/tx/:id", async (request, reply) => {
  const { id } = request.params;

  // Lookup transaction in database
  const dbRecord = await prisma.transaction.findUnique({
    where: { id },
  });

  // Return 404 if transaction doesn't exist
  if (!dbRecord) {
    return reply.status(404).send({
      error: "Transaction not found",
    });
  }

  // Convert database record to TxSecureRecord format
  const record: TxSecureRecord = {
    id: dbRecord.id,
    partyId: dbRecord.partyId,
    payload_nonce: dbRecord.iv,
    payload_ct: dbRecord.encryptedData,
    payload_tag: dbRecord.authTag,
    dek_wrap_nonce: dbRecord.dekWrapNonce,
    dek_wrapped: dbRecord.encryptedDek,
    dek_wrap_tag: dbRecord.dekWrapTag,
    alg: "AES-256-GCM",
    mk_version: 1,
    createdAt: dbRecord.createdAt.toISOString(),
  };

  // Log successful retrieval
  fastify.log.info(`Retrieved encrypted transaction ${id}`);

  // Return encrypted record (no decryption performed)
  return record;
});

/**
 * POST /tx/:id/decrypt
 * 
 * Decrypts an encrypted transaction and returns the original payload.
 * Performs DEK unwrapping and payload decryption using envelope encryption.
 * 
 * URL Parameters:
 * - id: Transaction UUID
 * 
 * Response:
 * {
 *   "id": "uuid",
 *   "partyId": "party_123",
 *   "createdAt": "ISO timestamp",
 *   "payload": { "amount": 100, "currency": "AED" }
 * }
 * 
 * Status Codes:
 * - 200: Success
 * - 404: Transaction not found
 * - 500: Decryption failure (invalid keys, tampered data, etc.)
 */
fastify.post<{
  Params: {
    id: string;
  };
}>("/tx/:id/decrypt", async (request, reply) => {
  try {
    const { id } = request.params;

    // Lookup transaction in database
    const dbRecord = await prisma.transaction.findUnique({
      where: { id },
    });

    // Return 404 if transaction doesn't exist
    if (!dbRecord) {
      return reply.status(404).send({
        error: "Transaction not found",
      });
    }

    // Convert database record to TxSecureRecord format for decryption
    const record: TxSecureRecord = {
      id: dbRecord.id,
      partyId: dbRecord.partyId,
      payload_nonce: dbRecord.iv,
      payload_ct: dbRecord.encryptedData,
      payload_tag: dbRecord.authTag,
      dek_wrap_nonce: dbRecord.dekWrapNonce,
      dek_wrapped: dbRecord.encryptedDek,
      dek_wrap_tag: dbRecord.dekWrapTag,
      alg: "AES-256-GCM",
      mk_version: 1,
      createdAt: dbRecord.createdAt.toISOString(),
    };

    // Perform envelope decryption (unwrap DEK, decrypt payload)
    const payload = decryptEnvelope(record);

    // Log successful decryption
    fastify.log.info(`Decrypted transaction ${id}`);

    // Return decrypted payload with metadata
    return {
      id: record.id,
      partyId: record.partyId,
      createdAt: record.createdAt,
      payload,
    };
  } catch (error) {
    // Log and return decryption error
    fastify.log.error(error);
    return reply.status(500).send({
      error: "Decryption failed",
      details: (error as Error).message,
    });
  }
});

/**
 * GET /health
 * 
 * Health check endpoint for monitoring server status.
 * Useful for load balancers, container orchestration, and monitoring tools.
 * 
 * Response:
 * {
 *   "status": "ok",
 *   "database": "connected",
 *   "timestamp": "ISO timestamp"
 * }
 */
fastify.get("/health", async () => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    return { 
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString() 
    };
  } catch (error) {
    return { 
      status: "ok",
      database: "disconnected",
      timestamp: new Date().toISOString() 
    };
  }
});

/**
 * Start the Fastify server
 * 
 * Reads configuration from environment variables:
 * - PORT: Server port (default: 3001)
 * - HOST: Server host (default: 0.0.0.0)
 * - MASTER_KEY_HEX: 32-byte master key for encryption (required)
 */
const start = async () => {
  try {
    // Read port from environment or use default
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
    
    // Read host from environment or use default (0.0.0.0 allows external connections)
    const host = process.env.HOST || "0.0.0.0";

    // Start listening on specified port and host
    await fastify.listen({ port, host });
    
    // Log server start message
    console.log(`🚀 API server running on http://${host}:${port}`);
  } catch (err) {
    // Log error and exit process if server fails to start
    fastify.log.error(err);
    process.exit(1);
  }
};

// Initialize server
start();