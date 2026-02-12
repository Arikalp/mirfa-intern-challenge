/**
 * Vercel Serverless Function Entry Point
 * 
 * This file adapts the Fastify application for Vercel's serverless environment.
 * All routes from src/index.ts are replicated here for serverless deployment.
 */

import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";
import { encryptEnvelope, decryptEnvelope, TxSecureRecord } from "@repo/crypto";

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  encryption: {
    algorithm: "AES-256-GCM" as const,
    masterKeyVersion: 1,
  },
} as const;

// =============================================================================
// INITIALIZATION
// =============================================================================

const prisma = new PrismaClient();

// Create Fastify instance optimized for serverless
const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'error' : 'info',
  },
});

// Register CORS
app.register(cors, {
  origin: true, // Allow all origins - configure stricter in production if needed
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert database record to TxSecureRecord format
 */
function dbRecordToTxSecureRecord(dbRecord: {
  id: string;
  partyId: string;
  encryptedDek: string;
  dekWrapNonce: string;
  dekWrapTag: string;
  encryptedData: string;
  iv: string;
  authTag: string;
  createdAt: Date;
}): TxSecureRecord {
  return {
    id: dbRecord.id,
    partyId: dbRecord.partyId,
    payload_nonce: dbRecord.iv,
    payload_ct: dbRecord.encryptedData,
    payload_tag: dbRecord.authTag,
    dek_wrap_nonce: dbRecord.dekWrapNonce,
    dek_wrapped: dbRecord.encryptedDek,
    dek_wrap_tag: dbRecord.dekWrapTag,
    alg: CONFIG.encryption.algorithm,
    mk_version: CONFIG.encryption.masterKeyVersion,
    createdAt: dbRecord.createdAt.toISOString(),
  };
}

// =============================================================================
// API ROUTES
// =============================================================================

/**
 * POST /tx/encrypt
 * Encrypts a JSON payload and stores it in database
 */
app.post<{
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

    // Perform envelope encryption
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

    app.log.info(`Encrypted transaction ${record.id} for party ${partyId}`);

    return {
      id: record.id,
      message: "Transaction encrypted and stored successfully",
    };
  } catch (error) {
    app.log.error(error);
    return reply.status(500).send({
      error: "Encryption failed",
      details: (error as Error).message,
    });
  }
});

/**
 * GET /tx/:id
 * Retrieves an encrypted transaction record
 */
app.get<{
  Params: {
    id: string;
  };
}>("/tx/:id", async (request, reply) => {
  const { id } = request.params;

  const dbRecord = await prisma.transaction.findUnique({
    where: { id },
  });

  if (!dbRecord) {
    return reply.status(404).send({
      error: "Transaction not found",
    });
  }

  const record = dbRecordToTxSecureRecord(dbRecord);
  app.log.info(`Retrieved encrypted transaction ${id}`);

  return record;
});

/**
 * POST /tx/:id/decrypt
 * Decrypts a transaction and returns original payload
 */
app.post<{
  Params: {
    id: string;
  };
}>("/tx/:id/decrypt", async (request, reply) => {
  try {
    const { id } = request.params;

    const dbRecord = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!dbRecord) {
      return reply.status(404).send({
        error: "Transaction not found",
      });
    }

    const record = dbRecordToTxSecureRecord(dbRecord);
    const payload = decryptEnvelope(record);

    app.log.info(`Decrypted transaction ${id}`);

    return {
      id: record.id,
      partyId: record.partyId,
      createdAt: record.createdAt,
      payload,
    };
  } catch (error) {
    app.log.error(error);
    return reply.status(500).send({
      error: "Decryption failed",
      details: (error as Error).message,
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get("/health", async () => {
  try {
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

// =============================================================================
// VERCEL SERVERLESS EXPORT
// =============================================================================

/**
 * Vercel serverless function handler
 * This adapter allows Fastify to run as a serverless function
 */
export default async (req: any, res: any) => {
  await app.ready();
  app.server.emit('request', req, res);
};
