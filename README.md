# elkon

Eliteikon — premium fashion online store (katalog + admin panel).

- **Frontend**: React + Vite + TailwindCSS (PWA) → `frontend/`
- **Backend**: Express JS + MySQL (REST API) → `backend/`

## Local Development

### 1. Database (MySQL)

```bash
mysql -u root -e "CREATE DATABASE elkon_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
mysql -u root --default-character-set=utf8mb4 elkon_db < kinq6231_elkon.sql
```

### 2. Backend

Konfigurasi di `backend/.env`:

```
PORT=5000
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=
DB_NAME=elkon_db
JWT_SECRET=<secret-anda>
```

```bash
cd backend
npm install
npm run dev   # nodemon, http://localhost:5000
```

### 3. Frontend

Tidak perlu konfigurasi tambahan — mode development otomatis memakai `frontend/.env.development` (`VITE_API_URL=http://localhost:5000/api`).

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

Catatan: jangan menyetel `VITE_API_URL` di `frontend/.env` / `frontend/.env.production` — nilainya ikut terbawa ke hasil `npm run build`.

### Akses via http://eikon.test (Apache Laragon)

Vhost `D:\laragon\etc\apache2\sites-enabled\auto.eikon.test.conf` menyajikan frontend **build** (`frontend/dist`) dengan proxy:

- `/api` → `http://127.0.0.1:5000/api`
- `/uploads-elkon` → `http://127.0.0.1:5000/uploads-elkon`

Setiap habis mengubah kode frontend, rebuild:

```bash
cd frontend
npm run build   # hasil ke folder dist
```

Catatan:
- Alamat API ditentukan **saat runtime** (`frontend/src/utils/api.js`): hostname lokal (`eikon.test`/`localhost`/`127.0.0.1`) → `/api` (diproxy Apache), hostname lain → API production. Satu hasil build berlaku untuk lokal maupun production.
- Hasil build (`frontend/dist`) **ikut di-commit ke git** — selalu jalankan `npm run build` sebelum commit (deploy production = `git pull`, lihat bagian Deploy).
- Untuk development dengan hot-reload, tetap pakai `npm run dev` di `http://localhost:5173` (memakai `frontend/.env.development`).
- Backend & MySQL harus jalan supaya `eikon.test` berfungsi penuh.

### Admin Panel

- URL: `http://localhost:5173/login`
- Email: `admin@elkon.com`
- Password: `admin123`
- Tab **Pesanan** untuk mengelola order (search, filter status, update status pengiriman).

## Deploy ke Production (pull-only)

Production: **https://www.eliteikon.com** (frontend) + **https://www.eliteikon.com/api** (backend Express, satu domain via reverse proxy `/api` → Node :5000).

Alur deploy: build di lokal → ikutkan ke git → di server cukup `git pull` (tidak perlu Node/npm di server untuk frontend).

```bash
# 1. Di lokal: build lalu commit + push (folder frontend/dist ikut ter-commit)
cd frontend && npm run build
cd .. && git add -A && git commit -m "Update" && git push

# 2. Di server production (sekali saja jika belum ada repo):
#    git clone https://github.com/linducip2208/eikon.git
git pull

# 3. Migrasi database yang belum dijalankan (lihat bagian File database)
mysql -u <user> -p <nama_db> < backend/sql/migration_orders.sql
mysql -u <user> -p <nama_db> < backend/sql/migration_settings.sql

# 4. Restart aplikasi Node backend (mis. cPanel → Setup Node.js App → Restart)
```

Setelah deploy, isi dari dashboard admin production → tab **Setting**:

- **Informasi Bisnis**: alamat lengkap, email, dan no. telepon admin.
- **Payment Gateway**: mode (sandbox/production), VA & API Key iPaymu, URL Website Toko = `https://eliteikon.com`.

Catatan: document root `eliteikon.com` diarahkan ke `frontend/dist` (atau copy isi folder tersebut). `frontend/dist` sengaja ikut git supaya server tidak butuh build sendiri.

## Pembayaran (iPaymu)

Checkout di halaman toko membuat pesanan di database lalu mengarahkan pembeli ke halaman pembayaran iPaymu (VA bank, QRIS, e-wallet). Status pembayaran diperbarui otomatis via callback webhook (signature divalidasi HMAC-SHA256).

### Konfigurasi (via menu Setting admin — tanpa edit .env)

Semua kredensial diatur dari **dashboard admin → tab Setting → bagian Payment Gateway** (tersimpan di database, langsung aktif tanpa restart server):

- **Mode**: `Sandbox` (testing) atau `Production` (live)
- **Nomor VA** & **API Key**: dari dashboard iPaymu → menu Integrasi
  - Sandbox: https://sandbox.ipaymu.com/integration
  - Production: https://my.ipaymu.com/integration
- **URL Website Toko**: domain toko untuk redirect setelah pembayaran (lokal: `http://eikon.test` · production: `https://eliteikon.com`)
- **URL Callback** (opsional): kosongkan untuk memakai otomatis `{URL Website Toko}/api/ipaymu/callback` — daftarkan URL ini di dashboard iPaymu agar status pembayaran ter-update otomatis
  - **Catatan**: callback harus bisa diakses dari internet oleh server iPaymu. Untuk testing lokal gunakan tunnel (mis. `ngrok http 5000`) dan isi URL Callback dengan `https://xxxx.ngrok-free.app/api/ipaymu/callback`
- Untuk production: daftarkan domain & IP statis server di pengaturan iPaymu

Catatan keamanan: endpoint publik `/api/settings` **tidak pernah** mengembalikan kredensial payment gateway — hanya endpoint admin (`/api/settings/admin`, butuh token) yang bisa membacanya.

### Alur status pesanan

`pending` → (callback iPaymu) → `paid` → `processing` → `shipped` → `completed`, serta `cancelled` / `expired`.

- Stok varian otomatis berkurang sekali saat status menjadi `paid` (idempotent).
- Halaman pembeli: `/order/{reference_id}` (menampilkan ringkasan, status realtime, tombol lanjut bayar).

### Halaman publik & informasi bisnis (persyaratan verifikasi payment gateway)

- `/faq` — Pertanyaan umum (pembayaran, pengiriman, refund, pre-order)
- `/refund-policy` — Kebijakan Refund (pembatalan, penukaran, pengembalian dana)
- `/terms` — Syarat & Ketentuan
- `/contact` — Kontak & alamat bisnis

Konten halaman kebijakan berada di `frontend/src/data/legal.js`. Alamat, email, dan nomor telepon bisnis diatur dari **admin → tab Setting → Informasi Bisnis** (tersimpan di `settings` sebagai `business_address`, `business_email`, `business_phone_admin`); nomor WhatsApp/Office memakai setting `whatsapp_number`. Semua nilai ini tampil otomatis di footer, halaman Kontak, dan halaman kebijakan.

### File database (`backend/sql`)

- `database.sql` — skema lengkap + seed untuk instalasi baru (admin, kategori, produk contoh, banner, settings termasuk info bisnis terbaru).
- `migration_orders.sql` — tabel `orders` + `order_items` untuk database yang sudah berjalan.
- `migration_settings.sql` — pengaturan info bisnis (`business_*`) untuk database yang sudah berjalan; aman diulang karena nilai yang sudah ada tidak ditimpa.

Jalankan migrasi ke database yang sudah ada (mis. production):

```bash
mysql -u root --default-character-set=utf8mb4 elkon_db < backend/sql/migration_orders.sql
mysql -u root --default-character-set=utf8mb4 elkon_db < backend/sql/migration_settings.sql
```

Catatan: kredensial payment gateway (`ipaymu_*`) dan `site_url` **tidak pernah di-seed** karena bersifat rahasia dan berbeda per environment — diatur dari dashboard admin: Setting > Payment Gateway.

### Catatan gambar produk

Gambar upload disimpan di `backend/uploads-elkon/` dan disajikan di `/uploads-elkon/...`.
URL gambar mengikuti base API (lihat `frontend/src/utils/api.js`), bisa dioverride lewat `VITE_MEDIA_URL`.
