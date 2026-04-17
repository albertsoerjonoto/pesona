import Link from 'next/link';

export const metadata = {
  title: 'Kebijakan Privasi - Pesona',
  description: 'Kebijakan privasi dan perlindungan data pengguna Pesona.io',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-8"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Kembali
        </Link>

        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Kebijakan Privasi Pesona
        </h1>
        <p className="text-sm text-text-tertiary mb-8">
          Berlaku sejak: 17 April 2026 &middot; Merujuk pada UU PDP No. 27 Tahun 2022
        </p>

        <div className="prose-pesona space-y-8">
          {/* Intro */}
          <section>
            <div className="text-sm text-text-secondary leading-relaxed space-y-2">
              <p>
                Pesona.io (&ldquo;Kami&rdquo;) berkomitmen melindungi data pribadi kamu
                sesuai dengan Undang-Undang Perlindungan Data Pribadi (UU PDP) No. 27
                Tahun 2022. Kebijakan ini menjelaskan bagaimana kami mengumpulkan,
                menggunakan, menyimpan, dan melindungi informasi kamu saat menggunakan
                layanan Pesona.
              </p>
            </div>
          </section>

          {/* 1 */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              1. Data yang Kami Kumpulkan
            </h2>
            <div className="text-sm text-text-secondary leading-relaxed space-y-2">
              <p><strong>Data profil:</strong> Nama, alamat email, tanggal lahir, jenis kelamin, dan foto profil yang kamu berikan saat registrasi.</p>
              <p><strong>Data skincare:</strong> Tipe kulit, masalah kulit (concerns), jawaban skin quiz, rutinitas skincare, dan data check-in harian.</p>
              <p><strong>Foto progres:</strong> Foto wajah dan kulit yang kamu unggah untuk tracking perkembangan kulit dan analisis AI.</p>
              <p><strong>Chat AI:</strong> Riwayat percakapan kamu dengan AI beauty coach Pesona, termasuk pertanyaan dan rekomendasi yang diberikan.</p>
              <p><strong>Data penggunaan:</strong> Informasi tentang bagaimana kamu menggunakan layanan kami (halaman yang dikunjungi, fitur yang digunakan, waktu akses).</p>
              <p><strong>Data perangkat:</strong> Jenis browser, sistem operasi, dan informasi perangkat dasar untuk optimasi layanan.</p>
            </div>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              2. Tujuan Penggunaan Data
            </h2>
            <div className="text-sm text-text-secondary leading-relaxed space-y-2">
              <p>Kami menggunakan data kamu untuk:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Memberikan rekomendasi skincare yang personal sesuai tipe dan masalah kulit kamu</li>
                <li>Mengoperasikan AI beauty coach untuk menjawab pertanyaan kecantikan</li>
                <li>Menganalisis foto untuk tracking perkembangan kulit</li>
                <li>Mengirimkan laporan mingguan dan reminder rutinitas</li>
                <li>Meningkatkan kualitas layanan dan pengalaman pengguna</li>
                <li>Memproses pembayaran langganan</li>
                <li>Mengirimkan komunikasi terkait layanan (update, maintenance)</li>
              </ul>
            </div>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              3. Perlindungan Data
            </h2>
            <div className="text-sm text-text-secondary leading-relaxed space-y-2">
              <p>
                Data kamu disimpan di server Supabase dengan enkripsi end-to-end dan
                Row-Level Security (RLS) yang memastikan hanya kamu yang bisa mengakses
                data milik kamu sendiri.
              </p>
              <p>
                Foto-foto kamu disimpan di Supabase Storage dengan kebijakan akses
                per-pengguna. Tidak ada pengguna lain yang bisa mengakses foto kamu.
              </p>
              <p>
                Transmisi data antara perangkat kamu dan server kami dienkripsi
                menggunakan HTTPS/TLS.
              </p>
            </div>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              4. Hak Pengguna (sesuai UU PDP)
            </h2>
            <div className="text-sm text-text-secondary leading-relaxed space-y-2">
              <p>Sesuai UU PDP No. 27 Tahun 2022, kamu memiliki hak untuk:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Hak akses:</strong> Meminta salinan data pribadi yang kami miliki tentang kamu</li>
                <li><strong>Hak koreksi:</strong> Memperbarui atau memperbaiki data pribadi yang tidak akurat</li>
                <li><strong>Hak penghapusan:</strong> Meminta penghapusan data pribadi kamu dari sistem kami</li>
                <li><strong>Hak membatasi pemrosesan:</strong> Meminta kami untuk membatasi penggunaan data kamu</li>
                <li><strong>Hak portabilitas:</strong> Meminta data kamu dalam format yang dapat dibaca mesin</li>
                <li><strong>Hak keberatan:</strong> Menolak pemrosesan data kamu untuk tujuan tertentu</li>
              </ul>
              <p>
                Untuk menggunakan hak-hak di atas, kamu bisa menghubungi kami melalui
                email atau menghapus akun langsung dari halaman Profil di aplikasi.
              </p>
            </div>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              5. Foto & Analisis AI
            </h2>
            <div className="text-sm text-text-secondary leading-relaxed space-y-2">
              <p>
                Foto yang kamu unggah tetap menjadi milik kamu sepenuhnya. Kami
                menggunakan foto tersebut hanya untuk memberikan analisis kulit melalui
                AI dan tracking progres kamu.
              </p>
              <p>
                Foto disimpan secara aman di Supabase Storage dengan akses terbatas
                hanya untuk akun kamu. Kami tidak membagikan foto kamu ke pihak ketiga
                atau menggunakannya untuk tujuan lain tanpa persetujuan eksplisit.
              </p>
              <p>
                Kamu bisa menghapus foto kapan saja melalui halaman Progres di aplikasi.
              </p>
            </div>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              6. Cookie & Analytics
            </h2>
            <div className="text-sm text-text-secondary leading-relaxed space-y-2">
              <p>
                Kami menggunakan PostHog sebagai platform analytics untuk memahami
                bagaimana pengguna menggunakan layanan kami. Data yang dikumpulkan
                bersifat anonim dan digunakan untuk meningkatkan pengalaman pengguna.
              </p>
              <p>
                Cookie yang kami gunakan meliputi: cookie sesi untuk menjaga login kamu,
                cookie preferensi (bahasa, tema), dan cookie analytics PostHog.
              </p>
            </div>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              7. Pihak Ketiga
            </h2>
            <div className="text-sm text-text-secondary leading-relaxed space-y-2">
              <p>Kami bekerja sama dengan pihak ketiga berikut dalam menyediakan layanan:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Supabase:</strong> Penyimpanan data dan autentikasi</li>
                <li><strong>Google (Gemini AI):</strong> Teknologi AI untuk beauty coach dan analisis kulit</li>
                <li><strong>Midtrans:</strong> Pemrosesan pembayaran (kami tidak menyimpan data kartu kredit)</li>
                <li><strong>Wati:</strong> Pengiriman notifikasi WhatsApp</li>
                <li><strong>PostHog:</strong> Analytics penggunaan layanan</li>
                <li><strong>Vercel:</strong> Hosting platform</li>
              </ul>
              <p>
                Setiap pihak ketiga hanya menerima data minimum yang diperlukan untuk
                menjalankan fungsinya, dan terikat oleh perjanjian kerahasiaan data.
              </p>
            </div>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              8. Retensi Data
            </h2>
            <div className="text-sm text-text-secondary leading-relaxed space-y-2">
              <p>
                Data profil dan skincare kamu disimpan selama akun kamu aktif. Jika kamu
                menghapus akun, semua data pribadi akan dihapus dalam 30 hari kerja.
              </p>
              <p>
                Data analytics yang sudah dianonimkan dapat disimpan lebih lama untuk
                keperluan peningkatan layanan.
              </p>
              <p>
                Data transaksi pembayaran disimpan sesuai kewajiban perpajakan Indonesia
                (minimal 10 tahun).
              </p>
            </div>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              9. Kontak
            </h2>
            <div className="text-sm text-text-secondary leading-relaxed space-y-2">
              <p>
                Jika kamu memiliki pertanyaan tentang kebijakan privasi ini atau ingin
                menggunakan hak-hak kamu terkait data pribadi, silakan hubungi kami:
              </p>
              <p>
                Email: privacy@pesona.io<br />
                Alamat: Jakarta, Indonesia
              </p>
              <p>
                Kami akan merespons permintaan kamu dalam 14 hari kerja sesuai ketentuan
                UU PDP.
              </p>
            </div>
          </section>
        </div>

        {/* Footer disclaimer */}
        <div className="mt-12 pt-6 border-t border-border">
          <p className="text-xs text-text-tertiary leading-relaxed">
            Pesona adalah produk wellness & edukasi kecantikan, bukan layanan medis.
            Untuk masalah kulit serius, konsultasikan ke dokter kulit. Dokumen ini
            merupakan template dan dapat disesuaikan sesuai kebutuhan hukum yang
            berlaku.
          </p>
        </div>

        <p className="text-center text-xs text-text-tertiary mt-8 mb-6">
          Pesona.io &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
