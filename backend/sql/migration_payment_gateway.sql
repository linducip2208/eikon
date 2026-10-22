-- Migration: default pengaturan Tripay non-rahasia (satu-satunya gateway)
-- Aman diulang: nilai yang sudah ada TIDAK ditimpa (value_text=value_text).
-- Kunci rahasia (API key, private key, merchant code) TIDAK ada di file ini —
-- isi lewat file payment_gateway_secrets.sql (lihat payment_gateway_secrets.example.sql).

INSERT INTO settings (key_name, value_text) VALUES
('tripay_env', 'sandbox'),
('tripay_channel', 'QRIS'),
('tripay_expired_minutes', '60')
ON DUPLICATE KEY UPDATE value_text=value_text;
