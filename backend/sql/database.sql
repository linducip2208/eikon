-- Database Schema for elkon fashion store (Revised with Banners and Settings)
CREATE DATABASE IF NOT EXISTS elkon_db;
USE elkon_db;

-- Users table for admin auth
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_price DECIMAL(12, 2) NOT NULL,
  image VARCHAR(255),
  images JSON NULL,
  category_id INT,
  status VARCHAR(20) DEFAULT 'active', -- active, draft
  is_preorder TINYINT(1) DEFAULT 0,
  preorder_days INT DEFAULT 14,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Product Variants table (Size, Color, SKU, Price Override, Stock, Variant Image)
CREATE TABLE IF NOT EXISTS product_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  size VARCHAR(50) NOT NULL,
  color VARCHAR(50) NOT NULL,
  sku VARCHAR(100) NOT NULL UNIQUE,
  price_override DECIMAL(12, 2) NULL, -- if null, use base_price from product
  stock INT NOT NULL DEFAULT 0,
  image VARCHAR(255) NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Contacts table for user feedback and message management
CREATE TABLE IF NOT EXISTS contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'unread', -- unread, read
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Banners table for homepage slider
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

-- Settings table for editable configuration keys
CREATE TABLE IF NOT EXISTS settings (
  key_name VARCHAR(100) PRIMARY KEY,
  value_text TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed Admin User (password: admin123)
INSERT INTO users (name, email, password, role) VALUES 
('Elkon Admin', 'admin@elkon.com', '$2a$10$tMhI3Q93l6M.8Jp7s9KqBuxm8n9Qx7L5pX5s6uA8EwG8oD.R1f1wK', 'admin')
ON DUPLICATE KEY UPDATE id=id;

-- Seed Categories
INSERT INTO categories (id, name) VALUES
(1, 'Outerwear'),
(2, 'Dresses'),
(3, 'Shirts')
ON DUPLICATE KEY UPDATE id=id;

-- Seed Products
INSERT INTO products (id, name, description, base_price, image, category_id, status) VALUES
(1, 'Linen Editorial Trench', 'Dibuat dari bahan linen berat premium washed, mantel trench dengan potongan wide-angle ini menawarkan siluet yang anggun, bahu rileks, dan penutup double-breasted. Pilihan sempurna untuk siang hari yang hangat dan malam yang sejuk.', 3450000.00, '/uploads-elkon/product_beige_coat.png', 1, 'active'),
(2, 'Raw Silk Slip Dress', 'Dipotong dengan potongan bias untuk siluet yang pas di badan, gaun slip midi ini terbuat dari sutra organik mentah. Menampilkan warna krem hangat yang halus, tali bahu tipis yang dapat disesuaikan, dan bagian punggung rendah yang menawan.', 2890000.00, '/uploads-elkon/product_silk_dress.png', 2, 'active'),
(3, 'Minimalist Linen Resort Shirt', 'Kemeja linen kasual berpotongan santai dengan kerah flat cuban dan garis bahu rendah. Terbuat dari linen organik kelas tinggi yang sangat sejuk dipakai. Dilengkapi dengan kancing kerang mutiara premium.', 1650000.00, '/uploads-elkon/product_linen_shirt.png', 3, 'active')
ON DUPLICATE KEY UPDATE id=id;

-- Seed Product Variants
INSERT INTO product_variants (product_id, size, color, sku, price_override, stock) VALUES
-- Variants for Linen Editorial Trench
(1, 'S', 'Beige', 'ELK-TRN-BEG-S', NULL, 15),
(1, 'M', 'Beige', 'ELK-TRN-BEG-M', NULL, 20),
(1, 'L', 'Beige', 'ELK-TRN-BEG-L', NULL, 10),
(1, 'S', 'Charcoal', 'ELK-TRN-CHA-S', 3650000.00, 8),
(1, 'M', 'Charcoal', 'ELK-TRN-CHA-M', 3650000.00, 12),
(1, 'L', 'Charcoal', 'ELK-TRN-CHA-L', 3650000.00, 0),

-- Variants for Raw Silk Slip Dress
(2, 'XS', 'Cream', 'ELK-SLP-CRM-XS', NULL, 5),
(2, 'S', 'Cream', 'ELK-SLP-CRM-S', NULL, 15),
(2, 'M', 'Cream', 'ELK-SLP-CRM-M', NULL, 18),
(2, 'L', 'Cream', 'ELK-SLP-CRM-L', NULL, 8),
(2, 'S', 'Olive', 'ELK-SLP-OLV-S', 2990000.00, 10),
(2, 'M', 'Olive', 'ELK-SLP-OLV-M', 2990000.00, 12),

-- Variants for Minimalist Linen Resort Shirt
(3, 'S', 'Off-White', 'ELK-RES-WHT-S', NULL, 25),
(3, 'M', 'Off-White', 'ELK-RES-WHT-M', NULL, 30),
(3, 'L', 'Off-White', 'ELK-RES-WHT-L', NULL, 20),
(3, 'XL', 'Off-White', 'ELK-RES-WHT-XL', NULL, 15),
(3, 'M', 'Sand', 'ELK-RES-SND-M', 1750000.00, 15),
(3, 'L', 'Sand', 'ELK-RES-SND-L', 1750000.00, 10)
ON DUPLICATE KEY UPDATE id=id;

-- Seed Contact Messages
INSERT INTO contacts (name, email, message, status) VALUES
('Budi Santoso', 'budi@gmail.com', 'Halo, apakah produk Linen Editorial Trench warna Beige ukuran XL akan segera diproduksi? Saya sangat tertarik membelinya.', 'unread'),
('Siti Aminah', 'siti@yahoo.com', 'Sore, saya ingin menanyakan tentang pengiriman ke Surabaya menggunakan ekspedisi apa saja ya? Apakah bisa sameday?', 'read')
ON DUPLICATE KEY UPDATE id=id;

-- Seed Banners
INSERT INTO banners (id, title, subtitle, image, link_url, status) VALUES
(1, 'Resonansi dari Keheningan & Ruang', 'Studi editorial potongan minimalis dengan pencahayaan alami.', '/assets/campaign-hero.png', '/shop', 'active'),
(2, 'Linen Editorial Trench', 'Mantel premium double-breasted untuk siluet yang anggun.', '/uploads-elkon/product_beige_coat.png', '/product/1', 'active'),
(3, 'Sutra Organik Murni & Alami', 'Gaun slip midi mewah yang ramah kulit dan mengalir indah.', '/uploads-elkon/product_silk_dress.png', '/product/2', 'active')
ON DUPLICATE KEY UPDATE id=id;

-- Seed Settings
INSERT INTO settings (key_name, value_text) VALUES 
('whatsapp_number', '6287865407492'),
('preorder_policy', '{"items":["Estimasi produksi: 7–14 hari kerja, kalau orderan terlalu banyak maksimal 40 hari kerja.","Pembayaran dilakukan sebelum pesanan diproses.","Pesanan yang sudah masuk produksi tidak dapat dibatalkan.","Perubahan ukuran/warna maksimal 1x24 jam setelah pembayaran.","Produk dikirim setelah proses produksi dan QC selesai.","Penukaran hanya berlaku untuk kesalahan pengiriman atau cacat produksi dengan video unboxing."],"disclaimer":"By placing an order, you agree to our Pre-Order Policy. ✨"}')
ON DUPLICATE KEY UPDATE value_text=value_text;
