import Link from 'next/link';

export const metadata = {
  title: 'Syarat & Ketentuan - Pesona',
  description: 'Syarat dan ketentuan penggunaan layanan Pesona.io',
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-bg">
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
          Syarat & Ketentuan Penggunaan Pesona
        </h1>
        <p className="text-sm text-text-tertiary mb-8">
          Berlaku sejak: 17 April 2026 &middot; Terakhir diperbarui: 17 April 2026
        </p>

        <div className="prose-pesona space-y-8">
          {/* 1 */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">1. Definisi</h2>
            <div className="text-sm text-text-secondary leading-relaxed space-y-2">
              <p>
                &ldquo;Pesona&rdquo; atau &ldquo;Kami&rdquo; mengacu pada PT Pesona
                Teknologi Indonesia, penyedia layanan platform wellness dan edukasi
                kecantikan melalui situs pesona.io dan aplikasi terkait.
              </p>
              <p>
                &ldquo;Pengguna&rdquo; atau &ldquo;Kamu&rdquo; mengacu pada individu yang
                mengakses dan menggunakan layanan Pesona.
              </p>
              <p>
                &ldquo;Layanan&rdquo; mencakup semua fitur yang tersedia melalui platform
                Pesona termasuk AI coach, analisis kulit, rekomendasi produk, dan fitur
                tracking lainnya.
              </p>
            </div>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              2. Layanan Pesona
            </h2>
            <div className="text-sm text-text-secondary leading-relaxed space-y-2">
              <p>
                Pesona adalah platform <strong>wellness dan edukasi kecantikan</strong>.
                Pesona <strong>BUKAN</strong> layanan medis, bukan layanan telehealth, dan
                bukan pengganti konsultasi dengan dokter kulit atau tenaga medis
                profesional.
              </p>
              <p>
                Layanan kami meliputi: rekomendasi rutinitas skincare harian, AI beauty
                coach untuk edukasi dan tips kecantikan, tracking progres kulit melalui
                foto, rekomendasi produk perawatan kulit yang terdaftar di BPOM, dan
                laporan mingguan perkembangan kulit.
              </p>
              <p>
                Jika kamu memiliki masalah kulit yang memerlukan penanganan medis, kami
                sangat menyarankan untuk berkonsultasi langsung dengan dokter spesialis
                kulit (dermatologis) yang terdaftar di PERDOSKI.
              </p>
            </div>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              3. Akun Pengguna
            </h2>
            <div className="text-sm text-text-secondary leading-relaxed space-y-2">
              <p>
                Untuk menggunakan layanan Pesona secara penuh, kamu perlu membuat akun
                dengan alamat email yang valid atau melalui login Google.
              </p>
              <p>
                Kamu bertanggung jawab menjaga keamanan akun dan password kamu. Pesona
                tidak bertanggung jawab atas kerugian yang timbul akibat penggunaan akun
                kamu oleh pihak yang tidak berwenang.
              </p>
              <p>
                Kamu harus berusia minimal 13 tahun untuk menggunakan layanan Pesona.
                Pengguna di bawah 18 tahun disarankan untuk mendapat persetujuan orang
                tua atau wali.
              </p>
            </div>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              4. Langganan & Pembayaran
            </h2>
            <div className="text-sm text-text-secondary leading-relaxed space-y-2">
              <p>
                Pesona menyediakan paket gratis dengan fitur terbatas dan paket
                berlangganan berbayar (Plus dan Pro) dengan fitur tambahan.
              </p>
              <p>
                Pembayaran diproses melalui Midtrans sebagai payment gateway resmi.
                Harga langganan tercantum dalam Rupiah Indonesia (IDR) dan sudah
                termasuk PPN yang berlaku.
              </p>
              <p>
                Langganan bulanan akan diperpanjang secara otomatis kecuali kamu
                membatalkannya sebelum tanggal perpanjangan. Kamu bisa membatalkan
                langganan kapan saja melalui halaman profil.
              </p>
              <p>
                Pengembalian dana (refund) dapat diajukan dalam 7 hari sejak tanggal
                pembayaran, dengan ketentuan berlaku.
              </p>
            </div>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              5. Konten AI & Disclaimer
            </h2>
            <div className="text-sm text-text-secondary leading-relaxed space-y-2">
              <p>
                Pesona menggunakan teknologi AI (kecerdasan buatan) untuk memberikan
                rekomendasi skincare dan tips kecantikan. Konten yang dihasilkan AI
                bersifat edukatif dan informatif.
              </p>
              <p>
                <strong>Konten AI bukan pengganti konsultasi medis profesional.</strong>
                {' '}Rekomendasi yang diberikan berdasarkan informasi umum tentang
                skincare dan tidak memperhitungkan kondisi medis spesifik kamu.
              </p>
              <p>
                Kami berusaha memberikan informasi yang akurat, namun tidak menjamin
                bahwa semua rekomendasi AI sesuai untuk setiap individu. Selalu lakukan
                patch test sebelum mencoba produk baru.
              </p>
            </div>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              6. Data Pribadi
            </h2>
            <div className="text-sm text-text-secondary leading-relaxed space-y-2">
              <p>
                Pengelolaan data pribadi kamu diatur dalam{' '}
                <Link href="/privacy" className="text-accent hover:underline">
                  Kebijakan Privasi
                </Link>{' '}
                kami yang merupakan bagian tidak terpisahkan dari Syarat & Ketentuan ini.
              </p>
              <p>
                Kami mematuhi Undang-Undang Perlindungan Data Pribadi (UU PDP) No. 27
                Tahun 2022 dalam pemrosesan dan penyimpanan data pribadi kamu.
              </p>
            </div>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              7. Hak Kekayaan Intelektual
            </h2>
            <div className="text-sm text-text-secondary leading-relaxed space-y-2">
              <p>
                Seluruh konten pada platform Pesona termasuk desain, logo, teks, grafis,
                dan kode sumber merupakan hak milik Pesona dan dilindungi oleh hukum hak
                cipta Indonesia.
              </p>
              <p>
                Foto dan data yang kamu unggah tetap menjadi milik kamu. Dengan
                mengunggah konten, kamu memberikan Pesona lisensi terbatas untuk
                memproses konten tersebut guna menyediakan layanan.
              </p>
            </div>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              8. Batasan Tanggung Jawab
            </h2>
            <div className="text-sm text-text-secondary leading-relaxed space-y-2">
              <p>
                Pesona tidak bertanggung jawab atas reaksi alergi atau efek samping yang
                mungkin timbul dari penggunaan produk yang direkomendasikan. Selalu
                lakukan patch test dan konsultasikan ke dokter jika terjadi reaksi yang
                tidak diinginkan.
              </p>
              <p>
                Layanan disediakan &ldquo;sebagaimana adanya&rdquo; (as-is). Kami tidak
                menjamin bahwa layanan akan selalu tersedia tanpa gangguan atau bebas
                dari kesalahan.
              </p>
              <p>
                Tanggung jawab maksimal Pesona terhadap pengguna terbatas pada jumlah
                yang telah dibayarkan oleh pengguna dalam 12 bulan terakhir.
              </p>
            </div>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              9. Perubahan Syarat & Ketentuan
            </h2>
            <div className="text-sm text-text-secondary leading-relaxed space-y-2">
              <p>
                Pesona berhak mengubah Syarat & Ketentuan ini sewaktu-waktu. Perubahan
                material akan diberitahukan melalui email atau notifikasi dalam aplikasi
                minimal 14 hari sebelum berlaku efektif.
              </p>
              <p>
                Dengan terus menggunakan layanan Pesona setelah perubahan berlaku, kamu
                dianggap menyetujui perubahan tersebut.
              </p>
            </div>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              10. Hukum yang Berlaku
            </h2>
            <div className="text-sm text-text-secondary leading-relaxed space-y-2">
              <p>
                Syarat & Ketentuan ini tunduk pada dan ditafsirkan berdasarkan hukum
                Republik Indonesia. Setiap perselisihan yang timbul akan diselesaikan
                melalui musyawarah mufakat, dan jika tidak tercapai, melalui Badan
                Arbitrase Nasional Indonesia (BANI) di Jakarta.
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
    </main>
  );
}
