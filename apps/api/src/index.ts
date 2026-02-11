import Fastify from "fastify";
import cors from "@fastify/cors";
import { encryptEnvelope, decryptEnvelope, TxSecureRecord } from "@repo/crypto";

const fastify = Fastify({
  logger: true,
});

// Enable CORS for frontend
fastify.register(cors, {
  origin: true,
});

// In-memory storage for encrypted records
const txStore = new Map<string, TxSecureRecord>();

/**
 * POST /tx/encrypt
 * Encrypts payload and stores encrypted record
 */
fastify.post<{
  Body: {
    partyId: string;
    payload: object;
  };
}>("/tx/encrypt", async (request, reply) => {
  try {
    const { partyId, payload } = request.body;

    if (!partyId || typeof partyId !== "string") {
      return reply.status(400).send({
        error: "partyId is required and must be a string",
      });
    }

    if (!payload || typeof payload !== "object") {
      return reply.status(400).send({
        error: "payload is required and must be an object",
      });
    }

    // Encrypt using envelope encryption
    const record = encryptEnvelope(partyId, payload);

    // Store in memory
    txStore.set(record.id, record);

    fastify.log.info(`Encrypted transaction ${record.id} for party ${partyId}`);

    return {
      id: record.id,
      message: "Transaction encrypted and stored successfully",
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({
      error: "Encryption failed",
      details: (error as Error).message,
    });
  }
});

/**
 * GET /tx/:id
 * Returns encrypted record (no decryption)
 */
fastify.get<{
  Params: {
    id: string;
  };
}>("/tx/:id", async (request, reply) => {
  const { id } = request.params;

  const record = txStore.get(id);

  if (!record) {
    return reply.status(404).send({
      error: "Transaction not found",
    });
  }

  fastify.log.info(`Retrieved encrypted transaction ${id}`);

  return record;
});

/**
 * POST /tx/:id/decrypt
 * Decrypts and returns original payload
 */
fastify.post<{
  Params: {
    id: string;
  };
}>("/tx/:id/decrypt", async (request, reply) => {
  try {
    const { id } = request.params;

    const record = txStore.get(id);

    if (!record) {
      return reply.status(404).send({
        error: "Transaction not found",
      });
    }

    // Decrypt envelope
    const payload = decryptEnvelope(record);

    fastify.log.info(`Decrypted transaction ${id}`);

    return {
      id: record.id,
      partyId: record.partyId,
      createdAt: record.createdAt,
      payload,
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({
      error: "Decryption failed",
      details: (error as Error).message,
    });
  }
});

/**
 * Health check endpoint
 */
fastify.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

/**
 * Start server
 */
const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
    const host = process.env.HOST || "0.0.0.0";

    await fastify.listen({ port, host });
    console.log(`🚀 API server running on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();