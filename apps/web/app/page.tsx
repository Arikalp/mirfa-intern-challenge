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
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        background: 'radial-gradient(circle at 20% 20%, #1E293B, #0B1220 70%)'
      }}
    >
      {/* Background Glow Effects */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-pulse-glow pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-pulse-glow pointer-events-none" 
           style={{ animationDelay: '1s' }} />

      <main className="max-w-5xl mx-auto px-4 py-12 relative z-10">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold tracking-tight mb-3" 
              style={{ 
                background: 'linear-gradient(135deg, #E5E7EB, #9CA3AF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
            Secure Transactions
          </h1>
          <p className="text-base text-[#9CA3AF] max-w-2xl mx-auto leading-relaxed">
            End-to-end encrypted transaction storage using AES-256-GCM envelope encryption
          </p>
          
          {/* Security Status Badge */}
          <div className="flex justify-center mt-6">
            <div className="status-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium">
              🔒 AES-256-GCM Encryption Active
            </div>
          </div>
        </div>

        {/* Main Transaction UI */}
        <TransactionUI />

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-[#9CA3AF] space-y-1">
          <p>Built with Next.js, Fastify, TurboRepo, and Node.js crypto</p>
          <p>Developed by Sankalp with love ❤️</p>
        </footer>
      </main>
    </div>
  );
}
