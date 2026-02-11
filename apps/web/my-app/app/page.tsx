import TransactionUI from "./components/TransactionUI";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <main className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            🔐 Secure Transactions Mini-App
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            AES-256-GCM Envelope Encryption Demo
          </p>
        </div>

        <TransactionUI />

        <footer className="mt-12 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>Built with Next.js, Fastify, and Node.js crypto</p>
          <p className="mt-2">Deployed on Vercel</p>
        </footer>
      </main>
    </div>
  );
}
