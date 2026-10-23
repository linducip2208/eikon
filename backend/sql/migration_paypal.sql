-- Migration: tambah PayPal sebagai gateway kedua + toggle aktif per gateway.
-- Aman diulang: nilai yang sudah ada TIDAK ditimpa (value_text=value_text).
-- Kunci rahasia (client id, secret) TIDAK ada di file ini —
-- isi lewat file payment_gateway_secrets.sql (lihat payment_gateway_secrets.example.sql).
-- Jalankan setelah migration_payment_gateway.sql:
--   mysql -u <user> -p <nama_db> < backend/sql/migration_paypal.sql

-- 1) Saklar aktif per gateway (default 1 = tampil di checkout bila kredensial lengkap)
INSERT INTO settings (key_name, value_text) VALUES
('tripay_enabled', '1'),
('paypal_enabled', '1')
ON DUPLICATE KEY UPDATE value_text=value_text;

-- 2) Default PayPal non-rahasia (PayPal hanya mendukung USD; nominal IDR
--    dikonversi memakai kurs paypal_rate)
INSERT INTO settings (key_name, value_text) VALUES
('paypal_env', 'sandbox'),
('paypal_rate', '16000')
ON DUPLICATE KEY UPDATE value_text=value_text;
