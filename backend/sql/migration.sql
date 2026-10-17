-- Migration SQL script to transition to categories, contacts, banners, and settings tables in elkon_db (Revised)

USE elkon_db;

-- 1. Create categories table if not exists
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed default categories if not already present
INSERT INTO categories (id, name) VALUES
(1, 'Outerwear'),
(2, 'Dresses'),
(3, 'Shirts')
ON DUPLICATE KEY UPDATE id=id;

-- 2. Alter products table
-- Add category_id column if not exists
ALTER TABLE products ADD COLUMN category_id INT NULL AFTER image;

-- Add foreign key constraint if not exists
ALTER TABLE products ADD CONSTRAINT fk_products_category_id FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- Migrate existing textual category data to category_id
UPDATE products SET category_id = 1 WHERE category = 'Outerwear' OR category = 'outerwear';
UPDATE products SET category_id = 2 WHERE category = 'Dresses' OR category = 'dresses';
UPDATE products SET category_id = 3 WHERE category = 'Shirts' OR category = 'shirts';

-- Drop the old category column safely
ALTER TABLE products DROP COLUMN category;

-- 3. Create contacts table if not exists
CREATE TABLE IF NOT EXISTS contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'unread', -- unread, read
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed initial contact messages (Indonesian)
INSERT INTO contacts (name, email, message, status) VALUES
('Budi Santoso', 'budi@gmail.com', 'Halo, apakah produk Linen Editorial Trench warna Beige ukuran XL akan segera diproduksi? Saya sangat tertarik membelinya.', 'unread'),
('Siti Aminah', 'siti@yahoo.com', 'Sore, saya ingin menanyakan tentang pengiriman ke Surabaya menggunakan ekspedisi apa saja ya? Apakah bisa sameday?', 'read')
ON DUPLICATE KEY UPDATE id=id;

-- 4. Create banners table
CREATE TABLE IF NOT EXISTS banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  image VARCHAR(255) NOT NULL,
  link_url VARCHAR(255) DEFAULT '/shop',
  status VARCHAR(20) DEFAULT 'active', -- active, inactive
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed default banners for Swiper
INSERT INTO banners (id, title, subtitle, image, link_url, status) VALUES
(1, 'Resonansi dari Keheningan & Ruang', 'Studi editorial potongan minimalis dengan pencahayaan alami.', '/assets/campaign-hero.png', '/shop', 'active'),
(2, 'Linen Editorial Trench', 'Mantel premium double-breasted untuk siluet yang anggun.', '/uploads-elkon/product_beige_coat.png', '/product/1', 'active'),
(3, 'Sutra Organik Murni & Alami', 'Gaun slip midi mewah yang ramah kulit dan mengalir indah.', '/uploads-elkon/product_silk_dress.png', '/product/2', 'active')
ON DUPLICATE KEY UPDATE id=id;

-- 5. Create settings table for editable parameters like WhatsApp
CREATE TABLE IF NOT EXISTS settings (
  key_name VARCHAR(100) PRIMARY KEY,
  value_text TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed default WhatsApp number setting
INSERT INTO settings (key_name, value_text) VALUES 
('whatsapp_number', '6287865407492')
ON DUPLICATE KEY UPDATE value_text=value_text;

-- Seed default pre-order policy
INSERT INTO settings (key_name, value_text) VALUES 
('preorder_policy', '{"items":["Estimasi produksi: 7–14 hari kerja, kalau orderan terlalu banyak maksimal 40 hari kerja.","Pembayaran dilakukan sebelum pesanan diproses.","Pesanan yang sudah masuk produksi tidak dapat dibatalkan.","Perubahan ukuran/warna maksimal 1x24 jam setelah pembayaran.","Produk dikirim setelah proses produksi dan QC selesai.","Penukaran hanya berlaku untuk kesalahan pengiriman atau cacat produksi dengan video unboxing."],"disclaimer":"By placing an order, you agree to our Pre-Order Policy. ✨"}')
ON DUPLICATE KEY UPDATE value_text=value_text;

-- 6. Add preorder fields to products table
ALTER TABLE products ADD COLUMN is_preorder TINYINT(1) DEFAULT 0 AFTER status;
ALTER TABLE products ADD COLUMN preorder_days INT DEFAULT 14 AFTER is_preorder;

