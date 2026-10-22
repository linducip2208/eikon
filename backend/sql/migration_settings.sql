-- Migration: Pengaturan Info Bisnis & Kontak (business_*)
-- Jalankan di database yang sudah berjalan (mis. production) — aman diulang:
-- nilai yang SUDAH ADA tidak akan ditimpa, jadi perubahan admin tetap aman.

INSERT INTO settings (key_name, value_text) VALUES
  ('business_email', 'ekonindonesiajaya@gmail.com'),
  ('business_phone_admin', '087753427090'),
  ('business_address', 'Jl. Kasuari 1 No. 167, Jaticempaka, Pondok Gede, Bekasi')
ON DUPLICATE KEY UPDATE value_text = value_text;

-- Catatan:
-- 1) whatsapp_number & preorder_policy sudah di-seed sejak awal (lihat database.sql).
-- 2) Pengaturan Tripay (tripay_*) dan site_url TIDAK di-seed karena bersifat rahasia dan
--    spesifik per environment — baris dibuat otomatis saat disimpan dari
--    dashboard admin (Payment Gateway).
