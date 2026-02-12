"use client";

import { useState } from "react";

// API base URL - configurable via environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * TransactionUI Component
 * 
 * Main UI component for the Secure Transaction Mini-App.
 * Provides interface for:
 * - Creating and encrypting new transactions
 * - Fetching encrypted transaction records
 * - Decrypting stored transactions
 * 
 * Uses React hooks for state management and async API calls.
 */
export default function TransactionUI() {
  // === Form State ===
  const [partyId, setPartyId] = useState("");
  const [payload, setPayload] = useState('{\n  "amount": 100,\n  "currency": "AED"\n}');
  
  // === Transaction State ===
  const [transactionId, setTransactionId] = useState("");
  const [lookupId, setLookupId] = useState("");
  
  // === UI State ===
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Handle encryption of a new transaction
   */
  const handleEncrypt = async () => {
    setError("");
    setResult(null);
    setLoading(true);

    try {
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

  /**
   * Handle fetching an encrypted transaction record
   */
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

  /**
   * Handle decryption of a stored transaction
   */
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
    <div className="space-y-10">
      {/* Top Section: Two-Column Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        
        {/* LEFT COLUMN: Create New Transaction */}
        <div className="glass-card rounded-xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-2xl">🔒</span>
            </div>
            <h2 className="text-2xl font-bold text-[#E5E7EB] tracking-tight">
              Create Transaction
            </h2>
          </div>
          
          <div className="space-y-6">
            {/* Party ID Input */}
            <div>
              <label className="block text-sm font-semibold text-[#9CA3AF] mb-2.5">
                Party ID
              </label>
              <input
                type="text"
                value={partyId}
                onChange={(e) => setPartyId(e.target.value)}
                placeholder="party_123"
                className="w-full px-4 py-3 bg-[#0F172A] border border-[rgba(255,255,255,0.08)] rounded-xl 
                         text-[#E5E7EB] placeholder-[#9CA3AF]/50
                         focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
                         transition-all duration-200"
              />
            </div>

            {/* JSON Payload Input */}
            <div>
              <label className="block text-sm font-semibold text-[#9CA3AF] mb-2.5">
                JSON Payload
              </label>
              <textarea
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                rows={7}
                placeholder='{\n  "amount": 100,\n  "currency": "AED"\n}'
                className="w-full px-4 py-3 bg-[#0F172A] border border-[rgba(255,255,255,0.08)] rounded-xl 
                         text-[#E5E7EB] placeholder-[#9CA3AF]/50 font-mono text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
                         transition-all duration-200 resize-none"
              />
            </div>

            {/* Encrypt Button */}
            <button
              onClick={handleEncrypt}
              disabled={loading || !partyId || !payload}
              className="w-full px-6 py-4 rounded-xl font-semibold text-white
                       btn-gradient-blue
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                       flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Encrypting...</span>
                </>
              ) : (
                <>
                  <span>🔐</span>
                  <span>Encrypt & Save</span>
                </>
              )}
            </button>

            {/* Generated Transaction ID Display */}
            {transactionId && (
              <div className="animate-fade-in-up mt-6 pt-6 border-t border-[rgba(255,255,255,0.08)]">
                <label className="block text-sm font-semibold text-[#9CA3AF] mb-2.5">
                  Generated Transaction ID
                </label>
                <div className="px-4 py-3.5 bg-linear-to-r from-green-500/10 to-emerald-500/10 
                              border border-green-500/30 rounded-xl">
                  <code className="text-green-400 font-mono text-sm break-all leading-relaxed">
                    {transactionId}
                  </code>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Lookup Panel */}
        <div className="glass-card rounded-xl p-8 flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-lg bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <span className="text-2xl">🔍</span>
            </div>
            <h2 className="text-2xl font-bold text-[#E5E7EB] tracking-tight">
              Lookup
            </h2>
          </div>
          
          <div className="space-y-6 flex-1">
            {/* Transaction ID Input */}
            <div>
              <label className="block text-sm font-semibold text-[#9CA3AF] mb-2.5">
                Transaction ID
              </label>
              <input
                type="text"
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                placeholder="Enter transaction ID"
                className="w-full px-4 py-3 bg-[#0F172A] border border-[rgba(255,255,255,0.08)] rounded-xl 
                         text-[#E5E7EB] placeholder-[#9CA3AF]/50 font-mono text-sm
                         focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50
                         transition-all duration-200"
              />
            </div>

            {/* Action Buttons - Stacked Vertically */}
            <div className="space-y-3">
              <button
                onClick={handleFetch}
                disabled={loading || !lookupId}
                className="w-full px-6 py-3.5 rounded-xl font-semibold text-white
                         btn-gradient-purple
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                         flex items-center justify-center gap-2"
              >
                <span>📦</span>
                <span>Fetch Record</span>
              </button>
              <button
                onClick={handleDecrypt}
                disabled={loading || !lookupId}
                className="w-full px-6 py-3.5 rounded-xl font-semibold text-white
                         btn-gradient-green
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                         flex items-center justify-center gap-2"
              >
                <span>🔓</span>
                <span>Decrypt</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Divider */}
      {(loading || error || result) && (
        <div className="divider" />
      )}

      {/* Bottom Section: Status and Results */}
      <div className="space-y-6">
        {/* Loading State */}
        {loading && (
          <div className="glass-card rounded-xl p-12 text-center animate-fade-in-up">
            <div className="inline-block w-14 h-14 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-6" />
            <p className="text-[#9CA3AF] font-semibold text-lg">Processing your request...</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="glass-card rounded-xl p-8 border-red-500/30 bg-red-500/5 animate-fade-in-up">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">❌</span>
              </div>
              <div className="flex-1">
                <p className="text-red-400 font-bold text-lg mb-2">Error</p>
                <p className="text-red-300/90 text-sm leading-relaxed">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Result Display - Full Width Section */}
        {result && (
          <div className="glass-card rounded-xl p-10 animate-fade-in-up">
            <div className="flex items-center gap-4 mb-8">
              <div className={`w-14 h-14 rounded-lg flex items-center justify-center shadow-lg
                ${result.type === "encrypt" ? "bg-blue-500/10 border border-blue-500/30 shadow-blue-500/20" : ""}
                ${result.type === "fetch" ? "bg-purple-500/10 border border-purple-500/30 shadow-purple-500/20" : ""}
                ${result.type === "decrypt" ? "bg-green-500/10 border border-green-500/30 shadow-green-500/20" : ""}
              `}>
                <span className="text-3xl">
                  {result.type === "encrypt" && "✅"}
                  {result.type === "fetch" && "📋"}
                  {result.type === "decrypt" && "🔓"}
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#E5E7EB]">
                  {result.type === "encrypt" && "Encryption Result"}
                  {result.type === "fetch" && "Encrypted Record"}
                  {result.type === "decrypt" && "Decrypted Payload"}
                </h3>
                <p className="text-sm text-[#9CA3AF] mt-1">
                  {result.type === "encrypt" && "Transaction successfully encrypted and stored"}
                  {result.type === "fetch" && "Encrypted transaction data retrieved"}
                  {result.type === "decrypt" && "Original payload decrypted successfully"}
                </p>
              </div>
            </div>
            
            <div className="code-block p-6 overflow-x-auto max-h-[500px] overflow-y-auto">
              <pre className="text-sm leading-relaxed">
                <code className="text-[#E5E7EB]">
                  {JSON.stringify(result.data, null, 2)}
                </code>
              </pre>
            </div>

            {/* Encryption Metadata (for fetch results) */}
            {result.type === "fetch" && result.data.alg && (
              <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.08)]">
                <p className="text-xs font-semibold text-[#9CA3AF] mb-3 uppercase tracking-wider">
                  Encryption Metadata
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-400 font-mono font-medium">
                    {result.data.alg}
                  </span>
                  <span className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-xs text-purple-400 font-mono font-medium">
                    Master Key v{result.data.mk_version}
                  </span>
                  <span className="px-4 py-2 bg-slate-500/10 border border-slate-500/30 rounded-lg text-xs text-slate-400 font-mono font-medium">
                    ID: {result.data.id.substring(0, 8)}...
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
