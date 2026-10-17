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

Konfigurasi di `frontend/.env`:

```
VITE_API_URL=http://localhost:5000/api
```

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

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
- Build memakai `frontend/.env.production` (`VITE_API_URL=/api`, relative → diproxy Apache).
- Untuk development dengan hot-reload, tetap pakai `npm run dev` di `http://localhost:5173`.
- Backend & MySQL harus jalan supaya `eikon.test` berfungsi penuh.

### Admin Panel

- URL: `http://localhost:5173/login`
- Email: `admin@elkon.com`
- Password: `admin123`
- Tab **Pesanan** untuk mengelola order (search, filter status, update status pengiriman).

## Pembayaran (iPaymu)

Checkout di halaman toko membuat pesanan di database lalu mengarahkan pembeli ke halaman pembayaran iPaymu (VA bank, QRIS, e-wallet). Status pembayaran diperbarui otomatis via callback webhook (signature divalidasi HMAC-SHA256).

### Konfigurasi

Isi kredensial di `backend/.env` (ambil dari dashboard iPaymu → Integration):

```
IPAYMU_ENV=sandbox            # sandbox | production
IPAYMU_VA=                    # Nomor VA merchant
IPAYMU_API_KEY=               # API Key
APP_URL=http://eikon.test     # untuk returnUrl & cancelUrl
IPAYMU_NOTIFY_URL=            # URL publik callback (opsional jika APP_URL sudah publik)
```

- Dashboard Sandbox: https://sandbox.ipaymu.com/integration
- Dashboard Production: https://my.ipaymu.com/integration
- **Callback webhook** harus bisa diakses dari internet oleh server iPaymu. Untuk testing lokal, gunakan tunnel (mis.: `ngrok http 5000` lalu isi `IPAYMU_NOTIFY_URL=https://xxxx.ngrok-free.app/api/ipaymu/callback`).
- Untuk production: daftarkan domain & IP statis server di pengaturan iPaymu, lalu set `IPAYMU_ENV=production`.

### Alur status pesanan

`pending` → (callback iPaymu) → `paid` → `processing` → `shipped` → `completed`, serta `cancelled` / `expired`.

- Stok varian otomatis berkurang sekali saat status menjadi `paid` (idempotent).
- Halaman pembeli: `/order/{reference_id}` (menampilkan ringkasan, status realtime, tombol lanjut bayar).

### Tabel database tambahan

Jalankan `backend/sql/migration_orders.sql` pada database yang sudah ada (membuat `orders` + `order_items`).

### Catatan gambar produk

Gambar upload disimpan di `backend/uploads-elkon/` dan disajikan di `/uploads-elkon/...`.
URL gambar mengikuti base API (lihat `frontend/src/utils/api.js`), bisa dioverride lewat `VITE_MEDIA_URL`.
