-- Migration SQL script to add multiple images support to products and variants in elkon_db

USE elkon_db;

-- 1. Add images column to products table if not exists
ALTER TABLE products ADD COLUMN images JSON NULL AFTER image;

-- 2. Add image column to product_variants table if not exists
ALTER TABLE product_variants ADD COLUMN image VARCHAR(255) NULL AFTER stock;

-- 3. Populate existing products images array from main image
UPDATE products 
SET images = JSON_ARRAY(image) 
WHERE image IS NOT NULL AND image != '' AND images IS NULL;
