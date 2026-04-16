import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-bg text-text-primary">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 bg-bg/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-16">
          <span className="text-lg font-bold">Pesona.io</span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold px-4 py-2 bg-accent text-accent-fg rounded-xl hover:bg-accent-hover transition-colors"
            >
              Daftar Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block px-3 py-1 mb-6 text-xs font-medium bg-accent-surface text-text-secondary rounded-full border border-border-strong">
            AI-Powered Beauty Coach
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
            Jadi versi paling menarik dari{' '}
            <span className="bg-gradient-to-r from-[#CE3D66] to-[#8B5CF6] bg-clip-text text-transparent">
              dirimu
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Personal beauty & body coach yang paham kulit dan tubuh kamu.
            Skincare routine, progress tracking, dan saran personal — semua dalam Bahasa Indonesia.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 bg-accent text-accent-fg font-semibold rounded-xl hover:bg-accent-hover transition-all active:scale-[0.98] text-center"
            >
              Mulai Sekarang
            </Link>
            <p className="text-sm text-text-tertiary">
              Mulai dari Rp 59.000/bulan
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-surface">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            Kenapa Pesona?
          </h2>
          <p className="text-text-secondary text-center mb-16 max-w-xl mx-auto">
            Coach AI yang benar-benar paham kebutuhan kecantikan orang Indonesia.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-bg rounded-2xl p-6 border border-border">
              <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-pink-600 dark:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Skincare Routine Personal</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Rutinitas pagi & malam yang disesuaikan dengan jenis kulit, masalah, dan budget kamu.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-bg rounded-2xl p-6 border border-border">
              <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Foto Progress Tracking</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Foto kulit kamu secara berkala dan lihat perubahan nyata dari waktu ke waktu.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-bg rounded-2xl p-6 border border-border">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">AI Coach Bahasa Indonesia</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Tanya apa saja soal skincare dalam Bahasa Indonesia. Paham produk lokal dan iklim tropis.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-bg rounded-2xl p-6 border border-border">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Rekomendasi Produk Lokal</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Tau Skintific, Somethinc, Wardah, Glad2Glow, Kahf, dan produk Indonesia lainnya.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-bg rounded-2xl p-6 border border-border">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Paham Iklim Tropis</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Saran yang cocok untuk cuaca panas & lembap Indonesia, termasuk tips saat puasa Ramadan.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-bg rounded-2xl p-6 border border-border">
              <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.502-4.688-4.502-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.748 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Skin Analysis dengan AI Vision</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Upload foto wajah dan dapatkan analisis kondisi kulit serta rekomendasi perawatan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-12">
            Cara Kerja Pesona
          </h2>
          <div className="grid sm:grid-cols-4 gap-6">
            {[
              { step: '1', emoji: '📝', title: 'Skin Quiz', desc: 'Jawab pertanyaan singkat tentang kulit kamu' },
              { step: '2', emoji: '🧴', title: 'Dapat Routine', desc: 'AI buatkan skincare routine personal' },
              { step: '3', emoji: '💬', title: 'Chat Sona', desc: 'Tanya apa saja soal skincare ke AI coach' },
              { step: '4', emoji: '📸', title: 'Track Progress', desc: 'Foto dan pantau perubahan kulit kamu' },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center">
                <div className="w-14 h-14 bg-accent-surface rounded-2xl flex items-center justify-center mb-3">
                  <span className="text-2xl">{item.emoji}</span>
                </div>
                <p className="font-semibold text-sm text-text-primary mb-1">{item.title}</p>
                <p className="text-xs text-text-secondary">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing hint */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Mulai perjalanan kecantikanmu
          </h2>
          <p className="text-text-secondary mb-8">
            Dapatkan skincare coach personal dengan harga kurang dari secangkir kopi per hari.
          </p>
          <div className="bg-surface rounded-2xl border border-border p-8 max-w-sm mx-auto">
            <p className="text-sm text-text-tertiary mb-1">Mulai dari</p>
            <p className="text-4xl font-bold">
              Rp 59<span className="text-xl">.000</span>
              <span className="text-base font-normal text-text-secondary">/bulan</span>
            </p>
            <ul className="mt-6 space-y-3 text-sm text-text-secondary text-left">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-positive shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Skincare routine personal
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-positive shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                AI coach unlimited chat
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-positive shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Foto progress tracking
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-positive shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Rekomendasi produk Indonesia
              </li>
            </ul>
            <Link
              href="/signup"
              className="block w-full mt-8 py-3 bg-accent text-accent-fg font-semibold rounded-xl hover:bg-accent-hover transition-all text-center active:scale-[0.98]"
            >
              Daftar Gratis
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 bg-surface">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">FAQ</h2>
          <div className="space-y-4">
            {[
              { q: 'Apakah ini layanan medis?', a: 'Tidak. Pesona adalah produk wellness & coaching. Untuk masalah kulit serius, kami akan rekomendasikan kamu ke dokter kulit.' },
              { q: 'Apakah produk yang direkomendasikan halal?', a: 'Kami menandai status halal dan BPOM setiap produk. Kamu bisa filter hanya produk halal saja.' },
              { q: 'Berapa harganya?', a: 'Mulai dari Rp 59.000/bulan untuk Plus. Ada juga tier Free dengan fitur terbatas.' },
              { q: 'Apakah AI coach bisa berbahasa Inggris?', a: 'Ya! Sona bisa bicara dalam Bahasa Indonesia dan English. Dia akan menyesuaikan dengan bahasa kamu.' },
            ].map((item, i) => (
              <div key={i} className="bg-bg rounded-xl p-5 border border-border">
                <p className="font-semibold text-sm text-text-primary mb-2">{item.q}</p>
                <p className="text-sm text-text-secondary">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-semibold">Pesona.io</span>
          <p className="text-xs text-text-tertiary">
            Pesona adalah produk wellness, bukan layanan medis. Untuk masalah kulit serius, konsultasikan ke dokter kulit.
          </p>
        </div>
      </footer>
    </div>
  );
}
