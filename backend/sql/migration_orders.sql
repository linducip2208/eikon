-- Migration: Orders + Order Items (untuk checkout & pembayaran iPaymu)
-- Jalankan di database elkon_db

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference_id VARCHAR(60) NOT NULL UNIQUE,
  buyer_name VARCHAR(255) NOT NULL,
  buyer_phone VARCHAR(50) NOT NULL,
  buyer_email VARCHAR(255) NULL,
  address TEXT NOT NULL,
  city VARCHAR(150) NOT NULL,
  notes TEXT NULL,
  subtotal DECIMAL(14,2) NOT NULL,
  total DECIMAL(14,2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending', -- pending, paid, processing, shipped, completed, cancelled, expired
  payment_provider VARCHAR(30) NOT NULL DEFAULT 'ipaymu',
  payment_session_id VARCHAR(120) NULL,
  payment_url VARCHAR(500) NULL,
  ipaymu_trx_id VARCHAR(60) NULL,
  payment_channel VARCHAR(50) NULL,
  paid_at DATETIME NULL,
  stock_reduced TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orders_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NULL,
  variant_id INT NULL,
  product_name VARCHAR(255) NOT NULL,
  variant_size VARCHAR(50) NULL,
  variant_color VARCHAR(50) NULL,
  sku VARCHAR(100) NULL,
  price DECIMAL(12,2) NOT NULL,
  quantity INT NOT NULL,
  subtotal DECIMAL(14,2) NOT NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
