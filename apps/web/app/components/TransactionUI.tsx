"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function TransactionUI() {
  const [partyId, setPartyId] = useState("");
  const [payload, setPayload] = useState('{\n  "amount": 100,\n  "currency": "AED"\n}');
  const [transactionId, setTransactionId] = useState("");
  const [lookupId, setLookupId] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEncrypt = async () => {
    setError("");
    setResult(null);
    setLoading(true);

    try {
      // Validate JSON
      const parsedPayload = JSON.parse(payload);

      const response = await fetch(`${API_URL}/tx/encrypt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          partyId,
          payload: parsedPayload,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Encryption failed");
      }

      setTransactionId(data.id);
      setResult({
        type: "encrypt",
        data,
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetch = async () => {
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/tx/${lookupId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Fetch failed");
      }

      setResult({
        type: "fetch",
        data,
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecrypt = async () => {
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/tx/${lookupId}/decrypt`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Decryption failed");
      }

      setResult({
        type: "decrypt",
        data,
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Create New Transaction Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          Create New Transaction
        </h2>
        
        <div className="space-y-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Party ID
            </label>
            <input
              type="text"
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
              placeholder="party_123"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              JSON Payload
            </label>
            <textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            />
          </div>

          <button
            onClick={handleEncrypt}
            disabled={loading || !partyId || !payload}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            🔒 Encrypt & Save
          </button>

          {transactionId && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Generated Transaction ID
              </label>
              <div className="w-full px-4 py-2 border border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg text-slate-900 dark:text-slate-100 font-mono text-sm break-all">
                {transactionId}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lookup Existing Transaction Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          Lookup Existing Transaction
        </h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Transaction ID
            </label>
            <input
              type="text"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              placeholder="Enter transaction ID to lookup"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleFetch}
              disabled={loading || !lookupId}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              📦 Fetch Record
            </button>
            <button
              onClick={handleDecrypt}
              disabled={loading || !lookupId}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              🔓 Decrypt Record
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Processing...</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200 font-medium">❌ Error</p>
          <p className="text-red-600 dark:text-red-300 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {result.type === "encrypt" && "✅ Encryption Result"}
            {result.type === "fetch" && "📋 Encrypted Record"}
            {result.type === "decrypt" && "🔓 Decrypted Payload"}
          </h3>
          <pre className="bg-white dark:bg-slate-800 rounded-lg p-4 overflow-x-auto text-sm">
            <code className="text-slate-800 dark:text-slate-200">
              {JSON.stringify(result.data, null, 2)}
            </code>
          </pre>
        </div>
      )}
    </div>
  );
}
