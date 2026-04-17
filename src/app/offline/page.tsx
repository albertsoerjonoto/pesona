'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-accent-surface rounded-full flex items-center justify-center">
          <span className="text-3xl">📶</span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Kamu lagi offline
        </h1>
        <p className="text-text-secondary mb-6">
          Cek koneksi internet kamu, terus coba lagi ya.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-accent-fg font-medium rounded-xl transition-all"
        >
          Coba lagi
        </button>
      </div>
    </div>
  );
}
