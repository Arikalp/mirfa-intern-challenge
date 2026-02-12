/**
 * Home Page - Secure Transactions Mini-App
 * 
 * Main landing page for the secure transaction application.
 * Demonstrates AES-256-GCM envelope encryption for transaction data.
 * 
 * Features:
 * - Encrypt transaction payloads
 * - Store encrypted records
 * - Fetch encrypted data
 * - Decrypt stored transactions
 */

import TransactionUI from "./components/TransactionUI";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <main className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            🔐 Secure Transactions Mini-App
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            End-to-end encrypted transaction storage using AES-256-GCM envelope encryption
          </p>
        </div>

        {/* Main Transaction UI */}
        <TransactionUI />

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>Built with Next.js, Fastify, TurboRepo, and Node.js crypto</p>
          <p className="mt-2">Developed by Sankalp with love ❤️</p>
        </footer>
      </main>
    </div>
  );
}
