-- Migration: hapus iPaymu, fokus ke Tripay saja (satu-satunya gateway).
-- Aman diulang. Jalankan setelah migration_payment_gateway.sql:
--   mysql -u <user> -p <nama_db> < backend/sql/migration_tripay_only.sql

-- 1) Hapus sisa pengaturan iPaymu & pemilih gateway lama (tidak dipakai lagi)
DELETE FROM settings WHERE key_name IN (
  'active_payment_gateway',
  'ipaymu_env',
  'ipaymu_va',
  'ipaymu_api_key',
  'ipaymu_notify_url'
);

-- 2) Pastikan default Tripay non-rahasia ada
INSERT INTO settings (key_name, value_text) VALUES
('tripay_env', 'sandbox'),
('tripay_channel', 'QRIS'),
('tripay_expired_minutes', '60')
ON DUPLICATE KEY UPDATE value_text=value_text;

-- 3) Samakan data historis: order lama yang masih bertanda ipaymu dianggap tripay
UPDATE orders SET payment_provider = 'tripay' WHERE payment_provider <> 'tripay';

-- 4) Default order baru = tripay (nama kolom ipaymu_trx_id dipertahankan agar data lama tetap terbaca)
ALTER TABLE orders ALTER COLUMN payment_provider SET DEFAULT 'tripay';
