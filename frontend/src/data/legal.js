// Konten halaman FAQ, Kebijakan Refund, dan Syarat & Ketentuan.
// Dipisahkan dari UI agar mudah diperbarui tanpa menyentuh komponen.

export const POLICY_LAST_UPDATED = "17 Oktober 2026";

export const FAQ_ITEMS = [
  {
    question: "Bagaimana cara memesan produk di Eliteikon?",
    answer:
      "Pilih produk di halaman Belanja, tentukan ukuran dan warna yang diinginkan, lalu klik Tambah ke Keranjang. Buka keranjang, isi data penerima (nama, nomor telepon, email, dan alamat lengkap), kemudian klik Lanjut ke Pembayaran. Anda akan diarahkan ke halaman pembayaran Tripay untuk menyelesaikan transaksi.",
  },
  {
    question: "Metode pembayaran apa saja yang tersedia?",
    answer:
      "Semua pembayaran diproses secara aman melalui Tripay, payment gateway yang terdaftar dan diawasi Bank Indonesia. Tersedia Virtual Account (BCA, BNI, BRI, Mandiri, dan bank lainnya), QRIS (semua aplikasi e-wallet dan m-banking), serta e-wallet seperti GoPay, OVO, DANA, dan ShopeePay.",
  },
  {
    question: "Berapa lama batas waktu pembayaran?",
    answer:
      "Setiap pesanan memiliki batas pembayaran 24 jam sejak dibuat. Jika melewati batas tersebut, pesanan akan otomatis kedaluwarsa tanpa biaya apa pun dan stok produk dikembalikan.",
  },
  {
    question: "Bagaimana cara melacak status pesanan saya?",
    answer:
      "Setelah checkout, Anda otomatis diarahkan ke halaman status pesanan beserta nomor referensi (contoh: ELK-20260101-XXXXXX). Simpan tautan halaman tersebut; status pesanan diperbarui secara otomatis mulai dari Menunggu Pembayaran, Dibayar, Diproses, Dikirim, hingga Selesai. Anda juga dapat menghubungi kami via WhatsApp dengan menyertakan nomor referensi.",
  },
  {
    question: "Berapa lama estimasi pengiriman pesanan?",
    answer:
      "Pesanan yang sudah dibayar diproses dalam 1–2 hari kerja. Estimasi tiba 2–4 hari kerja untuk area Jawa dan 3–7 hari kerja untuk luar Jawa, tergantung layanan kurir. Untuk produk pre-order, tambahkan estimasi produksi 7–14 hari kerja (maksimal 40 hari kerja saat pesanan sedang padat).",
  },
  {
    question: "Apa itu produk pre-order?",
    answer:
      "Produk pre-order adalah produk yang diproduksi setelah pesanan masuk. Keterangan pre-order tercantum di halaman detail produk beserta estimasi produksinya. Kebijakan pre-order pada halaman produk berlaku untuk pesanan jenis ini.",
  },
  {
    question: "Apakah pesanan bisa dibatalkan atau diubah?",
    answer:
      "Pesanan dapat dibatalkan tanpa biaya selama belum dibayar. Perubahan ukuran atau warna dapat diajukan maksimal 1×24 jam setelah pembayaran. Pesanan yang sudah masuk proses produksi tidak dapat dibatalkan. Pengembalian dana untuk pembatalan yang disetujui mengikuti Kebijakan Refund.",
  },
  {
    question: "Bagaimana jika produk rusak, cacat, atau salah kirim?",
    answer:
      "Ajukan klaim maksimal 2×24 jam setelah paket diterima dengan menyertakan video unboxing dan foto kondisi produk. Tim kami akan memverifikasi dalam 1–3 hari kerja dan memproses penukaran atau pengembalian dana sesuai Kebijakan Refund.",
  },
  {
    question: "Bagaimana jika ukuran tidak pas?",
    answer:
      "Kami menyarankan memeriksa panduan ukuran sebelum memesan. Penukaran ukuran hanya berlaku untuk kesalahan pengiriman atau cacat produksi (dengan video unboxing). Butuh bantuan menentukan ukuran? Tanyakan kepada tim kami via WhatsApp sebelum melakukan checkout.",
  },
  {
    question: "Bagaimana cara menghubungi customer service?",
    answer:
      "Hubungi WhatsApp Office (Senin–Jumat 09.00–17.00 WIB, Sabtu 09.00–15.00 WIB), kirim email, atau gunakan formulir di halaman Hubungi Kami. Kami merespons maksimal dalam 1×24 jam kerja.",
  },
];

export const REFUND_SECTIONS = [
  {
    heading: "Ketentuan Umum",
    paragraphs: [
      "Kebijakan ini mengatur pembatalan pesanan, penukaran produk, dan pengembalian dana (refund) untuk seluruh transaksi di Eliteikon.",
      "Seluruh pembayaran di situs ini diproses melalui Tripay, sehingga pengembalian dana dilakukan melalui transfer bank ke rekening pemesan.",
    ],
  },
  {
    heading: "Kondisi yang Memenuhi Syarat Refund",
    list: [
      "Pesanan dibatalkan sebelum masuk proses produksi atau pengiriman.",
      "Stok produk tidak tersedia setelah pembayaran berhasil.",
      "Produk diterima dalam kondisi cacat produksi, rusak saat pengiriman, atau salah kirim (dibuktikan dengan video unboxing).",
      "Pesanan tidak dikirim dalam jangka waktu yang wajar setelah pembayaran dikonfirmasi.",
    ],
  },
  {
    heading: "Kondisi yang Tidak Memenuhi Syarat Refund",
    list: [
      "Pembeli berubah pikiran setelah pesanan masuk proses produksi atau pengiriman.",
      "Produk pre-order yang sudah diproduksi sesuai pesanan.",
      "Kerusakan yang timbul setelah pemakaian, pencucian, atau modifikasi oleh pembeli.",
      "Klaim tanpa video unboxing atau diajukan melewati 2×24 jam sejak paket diterima.",
      "Perbedaan warna tipis akibat tampilan layar perangkat (bukan cacat produksi).",
    ],
  },
  {
    heading: "Prosedur Pengajuan Klaim",
    list: [
      "Hubungi kami via WhatsApp atau email maksimal 2×24 jam setelah paket diterima.",
      "Sertakan nomor referensi pesanan, video unboxing, dan foto kondisi produk.",
      "Tim kami memverifikasi laporan dalam 1–3 hari kerja.",
      "Jika disetujui, kami memproses pengembalian dana atau penukaran produk sesuai pilihan Anda dan ketersediaan stok.",
    ],
  },
  {
    heading: "Metode & Waktu Pengembalian Dana",
    paragraphs: [
      "Dana dikembalikan melalui transfer bank ke rekening atas nama pemesan, maksimal 7–14 hari kerja setelah pengajuan disetujui.",
      "Untuk pembayaran melalui Virtual Account, QRIS, atau e-wallet Tripay, dana dikembalikan melalui transfer bank ke rekening yang Anda cantumkan.",
      "Biaya administrasi bank (jika ada) menjadi tanggungan pembeli.",
    ],
  },
  {
    heading: "Pembatalan & Kedaluwarsa Otomatis",
    paragraphs: [
      "Pesanan yang belum dibayar dalam 24 jam akan kedaluwarsa secara otomatis tanpa biaya dan tidak memerlukan pengajuan refund.",
      "Jika kami membatalkan pesanan karena stok tidak tersedia, dana dikembalikan 100% tanpa potongan.",
    ],
  },
  {
    heading: "Biaya Pengiriman Retur",
    list: [
      "Kesalahan dari pihak kami (salah kirim atau cacat produksi): ongkos kirim retur ditanggung toko.",
      "Di luar kesalahan kami: ongkos kirim retur ditanggung pembeli.",
    ],
  },
  {
    heading: "Kontak Pengajuan",
    paragraphs: [
      "Pengajuan pembatalan, penukaran, atau refund dapat disampaikan melalui WhatsApp atau email resmi kami yang tercantum di halaman Hubungi Kami dan bagian bawah halaman ini.",
    ],
  },
];

export const TERMS_SECTIONS = [
  {
    heading: "Penerimaan Syarat & Ketentuan",
    paragraphs: [
      "Dengan mengakses situs Eliteikon dan melakukan pemesanan, Anda dianggap telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan yang berlaku pada halaman ini.",
    ],
  },
  {
    heading: "Data Pembeli",
    list: [
      "Pembeli wajib mengisi data yang benar, lengkap, dan terbaru: nama, nomor telepon, email, serta alamat pengiriman.",
      "Pesanan yang gagal dikirim akibat data yang salah menjadi tanggung jawab pembeli.",
      "Kami menjaga kerahasiaan data Anda dan hanya menggunakannya untuk keperluan pemrosesan pesanan.",
    ],
  },
  {
    heading: "Produk & Harga",
    list: [
      "Semua harga ditampilkan dalam Rupiah (IDR) dan dapat berubah sewaktu-waktu tanpa pemberitahuan sebelumnya.",
      "Foto produk diusahakan semirip mungkin dengan aslinya; perbedaan warna tipis dapat terjadi karena tampilan layar.",
      "Stok bersifat terbatas dan diperbarui secara berkala.",
    ],
  },
  {
    heading: "Pemesanan",
    list: [
      "Pesanan dinyatakan sah setelah pembayaran berhasil diverifikasi oleh sistem.",
      "Kami berhak membatalkan pesanan dengan pengembalian dana penuh apabila stok tidak tersedia atau ditemukan indikasi penyalahgunaan.",
      "Nomor referensi pesanan wajib disimpan untuk keperluan pelacakan dan klaim.",
    ],
  },
  {
    heading: "Pembayaran",
    list: [
      "Seluruh pembayaran diproses melalui Tripay: Virtual Account bank, QRIS, dan e-wallet.",
      "Verifikasi pembayaran dilakukan otomatis oleh sistem Tripay dan tercermin pada halaman status pesanan.",
      "Batas waktu pembayaran adalah 24 jam sejak pesanan dibuat; setelah itu pesanan kedaluwarsa secara otomatis.",
      "Kami tidak pernah meminta pembayaran di luar kanal resmi yang tercantum di situs ini.",
    ],
  },
  {
    heading: "Pengiriman",
    list: [
      "Pesanan dikirim ke alamat yang diisi saat checkout menggunakan jasa kurir rekanan kami.",
      "Estimasi pengiriman bersifat perkiraan dan dapat berubah karena faktor di luar kendali kami, seperti cuaca, hari libur, atau kendala kurir.",
      "Kami akan membantu proses penelusuran apabila terjadi keterlambatan pengiriman.",
    ],
  },
  {
    heading: "Pembatalan & Pengembalian Dana",
    paragraphs: [
      "Ketentuan pembatalan, penukaran, dan pengembalian dana diatur dalam Kebijakan Refund yang merupakan bagian tidak terpisahkan dari syarat dan ketentuan ini.",
    ],
  },
  {
    heading: "Produk Pre-Order",
    paragraphs: [
      "Untuk produk pre-order, estimasi waktu produksi tercantum pada halaman detail produk. Kebijakan pre-order pada halaman produk merupakan bagian tidak terpisahkan dari syarat dan ketentuan ini.",
    ],
  },
  {
    heading: "Kekayaan Intelektual",
    list: [
      "Seluruh konten situs (logo, foto, teks, dan desain) merupakan milik Eliteikon dan dilindungi oleh hukum yang berlaku.",
      "Dilarang menggunakan konten kami untuk keperluan komersial tanpa izin tertulis.",
    ],
  },
  {
    heading: "Larangan Penggunaan",
    list: [
      "Dilarang melakukan pemesanan fiktif, manipulasi sistem, atau tindakan lain yang merugikan toko maupun pembeli lain.",
      "Pelanggaran dapat menyebabkan pembatalan pesanan dan pemblokiran akses.",
    ],
  },
  {
    heading: "Batasan Tanggung Jawab",
    paragraphs: [
      "Tanggung jawab kami atas setiap transaksi dibatasi maksimal sebesar nilai transaksi yang bersangkutan. Kami tidak bertanggung jawab atas kerugian tidak langsung yang timbul akibat penggunaan situs ini.",
    ],
  },
  {
    heading: "Perubahan Syarat & Ketentuan",
    paragraphs: [
      "Kami dapat memperbarui syarat dan ketentuan ini sewaktu-waktu. Versi terbaru yang ditampilkan di halaman ini adalah versi yang berlaku, dengan tanggal pembaruan tercantum di bagian atas halaman.",
    ],
  },
  {
    heading: "Hukum yang Berlaku",
    paragraphs: [
      "Syarat dan ketentuan ini tunduk pada hukum yang berlaku di Republik Indonesia.",
    ],
  },
  {
    heading: "Kontak Resmi",
    paragraphs: [
      "Pertanyaan mengenai syarat dan ketentuan dapat disampaikan melalui WhatsApp, email, atau halaman Hubungi Kami yang tercantum di situs ini.",
    ],
  },
];

export const PRIVACY_SECTIONS = [
  {
    heading: "Pendahuluan",
    paragraphs: [
      "Kebijakan Privasi ini menjelaskan bagaimana Eliteikon mengumpulkan, menggunakan, menyimpan, dan melindungi data pribadi Anda saat mengakses dan berbelanja di situs ini.",
      "Dengan menggunakan layanan kami, Anda dianggap telah membaca dan menyetujui praktik pengelolaan data sebagaimana dijelaskan dalam kebijakan ini.",
    ],
  },
  {
    heading: "Data yang Kami Kumpulkan",
    list: [
      "Data identitas dan kontak: nama, nomor telepon, dan alamat email.",
      "Data pengiriman: alamat lengkap penerima paket.",
      "Data transaksi: detail pesanan (produk, jumlah, dan total pembayaran) serta status pembayaran.",
      "Data teknis: alamat IP, jenis perangkat/browser, dan aktivitas kunjungan untuk keamanan serta peningkatan layanan.",
    ],
  },
  {
    heading: "Cara Kami Menggunakan Data",
    list: [
      "Memproses dan mengirimkan pesanan Anda.",
      "Memverifikasi pembayaran dan memperbarui status pesanan.",
      "Menghubungi Anda terkait pesanan, layanan pelanggan, dan informasi penting lainnya.",
      "Menjaga keamanan situs serta mencegah penyalahgunaan.",
      "Kami tidak menjual atau menyewakan data pribadi Anda kepada pihak lain.",
    ],
  },
  {
    heading: "Pembayaran & Pihak Ketiga",
    list: [
      "Seluruh pembayaran diproses melalui Tripay, payment gateway yang terdaftar dan diawasi Bank Indonesia.",
      "Data pembayaran (Virtual Account, QRIS, atau e-wallet) diproses langsung oleh Tripay sesuai kebijakan privasi Tripay. Kami tidak menyimpan data kartu, PIN, atau kredensial perbankan Anda.",
      "Data dibagikan kepada pihak ketiga hanya sebatas keperluan layanan: jasa kurir (nama, telepon, dan alamat pengiriman) serta penyedia pembayaran.",
    ],
  },
  {
    heading: "Cookie & Penyimpanan Lokal",
    list: [
      "Situs ini menggunakan penyimpanan lokal browser (localStorage) untuk menyimpan isi keranjang belanja Anda.",
      "Token sesi digunakan untuk autentikasi pada halaman admin.",
      "Anda dapat menghapus data ini kapan saja melalui pengaturan browser Anda.",
    ],
  },
  {
    heading: "Keamanan & Penyimpanan Data",
    paragraphs: [
      "Data disimpan di server dengan akses terbatas dan transmisi data dilindungi enkripsi (HTTPS).",
      "Kami menyimpan data pesanan selama diperlukan untuk keperluan administrasi, layanan purna jual, dan kewajiban hukum.",
    ],
  },
  {
    heading: "Hak Anda",
    list: [
      "Meminta akses dan salinan data pribadi yang kami simpan.",
      "Meminta koreksi data yang tidak akurat.",
      "Meminta penghapusan data pribadi, sepanjang tidak bertentangan dengan kewajiban hukum kami.",
      "Pengajuan dapat disampaikan melalui kontak resmi pada bagian bawah halaman ini.",
    ],
  },
  {
    heading: "Perubahan Kebijakan Privasi",
    paragraphs: [
      "Kebijakan ini dapat diperbarui sewaktu-waktu. Versi terbaru yang ditampilkan di halaman ini adalah versi yang berlaku, dengan tanggal pembaruan tercantum di bagian atas halaman.",
    ],
  },
  {
    heading: "Kontak",
    paragraphs: [
      "Untuk pertanyaan mengenai kebijakan privasi ini, hubungi kami melalui WhatsApp atau email resmi yang tercantum di halaman Hubungi Kami dan bagian bawah halaman ini.",
    ],
  },
];
