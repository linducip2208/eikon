-- Seed katalog dari production (dibuat otomatis, aman diulang; data production menang bila id bentrok dengan seed contoh).
-- Import di phpMyAdmin host baru SETELAH database.sql. TIDAK berisi kredensial.
SET FOREIGN_KEY_CHECKS=0;

-- Categories
INSERT INTO categories (id, name) VALUES (6, 'Luxury Items') ON DUPLICATE KEY UPDATE id=id;
INSERT INTO categories (id, name) VALUES (7, 'Bag & Shoes') ON DUPLICATE KEY UPDATE id=id;
INSERT INTO categories (id, name) VALUES (5, 'Signature Items') ON DUPLICATE KEY UPDATE id=id;
INSERT INTO categories (id, name) VALUES (3, 'Shirts') ON DUPLICATE KEY UPDATE id=id;

-- Products
INSERT INTO products (id, name, description, base_price, image, images, category_id, status, is_preorder, preorder_days) VALUES (10, 'other items', '', 5000.00, '/uploads-elkon/1792667784250-761013074.jpeg', '["/uploads-elkon/1792667784250-761013074.jpeg"]', 6, 'active', 0, 14) ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), base_price=VALUES(base_price), image=VALUES(image), images=VALUES(images), category_id=VALUES(category_id), status=VALUES(status), is_preorder=VALUES(is_preorder), preorder_days=VALUES(preorder_days);
INSERT INTO products (id, name, description, base_price, image, images, category_id, status, is_preorder, preorder_days) VALUES (9, 'Timeless Journey Weekender Luxury Bag', 'Timeless Journey Weekender Bag

Crafted for timeless journeys, designed for modern living.

The ELITEIKON Timeless Journey Weekender combines a refined deep olive finish with signature black detailing and thoughtfully organized compartments. Designed for weekend escapes, business trips, and everyday essentials, its spacious silhouette offers a balance of functionality and understated elegance.

Product Details

Material: Premium microfiber leather (proposed)
Color: Deep Olive Black
Trims: Black woven webbing and gunmetal hardware
Interior: Beige champagne lining with zippered pockets
Dimensions: 48 × 28 × 25 cm (proposed)
Carrying Options: Top handles and adjustable shoulder strap
Design: Signature front panel and embossed floral logo tag
Collection: Timeless Journey

', 3500000.00, '/uploads-elkon/1792063182132-458548936.png', '["/uploads-elkon/1792063182132-458548936.png"]', 6, 'active', 0, 14) ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), base_price=VALUES(base_price), image=VALUES(image), images=VALUES(images), category_id=VALUES(category_id), status=VALUES(status), is_preorder=VALUES(is_preorder), preorder_days=VALUES(preorder_days);
INSERT INTO products (id, name, description, base_price, image, images, category_id, status, is_preorder, preorder_days) VALUES (8, 'Textured Leather Briefcase', 'Product Description

Designed for modern professionals, the Eliteikon Premium Textured Leather Briefcase combines timeless sophistication with everyday functionality. Featuring a structured silhouette, elegant top handles, a detachable adjustable shoulder strap, and a sleek front zipper pocket, this versatile bag is ideal for work, business meetings, travel, and daily essentials.

Its refined dark brown-black finish, subtle embossed-style texture, and polished silver-tone hardware create an understated luxury aesthetic suitable for both men and women.

Product Details

Brand: Eliteikon
Product Name: Premium Textured Leather Briefcase
Bag Type: Business Briefcase / Crossbody Work Bag
Color: Dark Espresso Brown / Black-Brown
Exterior Material: Textured Leather — final material specification to be confirmed
Recommended Leather Option: Pebbled Top-Grain Cowhide Leather
Lining: Durable Polyester or Microfiber Fabric
Hardware: Silver-Tone Metal
Closure: Top Zipper Closure
Front Pocket: Horizontal Zipper Pocket
Handles: Two Structured Top Handles
Shoulder Strap: Adjustable and Detachable
Design: Structured, Minimalist, Timeless
Style: Modern Luxury / Business Casual

Recommended Dimensions
Width: 38 cm
Height: 28 cm
Depth: 8 cm
Handle Drop: 10–12 cm
Shoulder Strap Length: 100–130 cm, adjustable
Shoulder Strap Width: 3–3.8 cm
Capacity & Functionality

Designed to accommodate everyday professional essentials, including:

A laptop up to 13 inches, subject to actual internal dimensions
Documents and A4-sized folders
A wallet, smartphone, keys, and personal accessories
A notebook, pens, and other work essentials

Recommended Occasions:
Office and business meetings
Professional and corporate settings
Business trips and travel
Daily commuting
Smart-casual and formal occasions', 5000000.00, '/uploads-elkon/1792062579227-766597963.png', '["/uploads-elkon/1792062579227-766597963.png"]', 7, 'active', 0, 14) ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), base_price=VALUES(base_price), image=VALUES(image), images=VALUES(images), category_id=VALUES(category_id), status=VALUES(status), is_preorder=VALUES(is_preorder), preorder_days=VALUES(preorder_days);
INSERT INTO products (id, name, description, base_price, image, images, category_id, status, is_preorder, preorder_days) VALUES (7, 'Textured Leather Crossbody Bag Luxury', 'Designed with a rich chocolate-brown texture, refined silver-tone hardware, and a minimalist silhouette, the Eliteikon Crossbody Bag brings timeless elegance to your everyday essentials.

From daily errands to city strolls and smart-casual occasions, carry your essentials with effortless confidence.

Product Details

Color: Chocolate Brown
Material: Original Pebbled Leather
Lining: Durable polyester or microfiber lining
Hardware: Silver-tone metal
Closure: Top zipper closure
Front Detail: Horizontal front zip pocket
Strap: Adjustable shoulder strap
Dimensions: 24 × 17 × 7 cm
Style: Minimalist, Timeless, Everyday Luxury
Recommended Use: Daily wear, shopping, travel, and smart-casual occasions

Collection: Eliteikon Everyday Elegance

Crafted for Timeless Feminine.

#Eliteikon #EliteikonBags #TimelessElegance #LuxuryEveryday #CrossbodyBag', 2500000.00, '/uploads-elkon/1792062221615-753790979.png', '["/uploads-elkon/1792062221615-753790979.png","/uploads-elkon/1792062221665-785772685.jpeg"]', 6, 'active', 0, 14) ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), base_price=VALUES(base_price), image=VALUES(image), images=VALUES(images), category_id=VALUES(category_id), status=VALUES(status), is_preorder=VALUES(is_preorder), preorder_days=VALUES(preorder_days);
INSERT INTO products (id, name, description, base_price, image, images, category_id, status, is_preorder, preorder_days) VALUES (6, 'Premium The Aurelia Set Rayon twill Luxury', 'Introducing our latest collection The Aurelia Set, crafted from premium Luxury Rayon Twill. Designed with a soft, flowing silhouette and a subtle romantic touch, this set offers effortless grace for your daily style. 🌸

Product Specifica
Product Details
Top (Blouse / Shirt):
Bust (LD): ± 108 – 112 cm
Top Length (PB): ± 68 – 72 cm
Sleeve Length: ± 55 – 57 cm
Bottoms (Wide-Leg Culottes / Palazzo):
Pants Length (PC): ± 95 – 98 cm
Waist (LP): ± 60 – 105 cm (Full Elastic Waistband)
Thigh / Hem Width: Wide A-line cut, approx. 70 – 75 cm

💡 Material & Fit Notes:

Recommended Weight: Ideal for 45 kg – 75 kg (Fit to L–XL).
Fabric Characteristics: Premium Rayon Twill is soft, lightweight, breathable, highly absorbent, and drapes beautifully on the body.', 590000.00, '/uploads-elkon/1789029468713-172458301.png', '["/uploads-elkon/1789029468713-172458301.png"]', 5, 'active', 0, 14) ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), base_price=VALUES(base_price), image=VALUES(image), images=VALUES(images), category_id=VALUES(category_id), status=VALUES(status), is_preorder=VALUES(is_preorder), preorder_days=VALUES(preorder_days);
INSERT INTO products (id, name, description, base_price, image, images, category_id, status, is_preorder, preorder_days) VALUES (5, 'Premium Rayon Twill Flowing Drape Set', 'Introducing our Luxury Introducing our Luxury Flowing Drape Set — where graceful femininity meets effortless sophistication.

Made from premium Rayon Twill, featuring a soft, smooth touch and beautiful flow that drapes elegantly with every movement. Designed with delicate floral details, refined tailoring, and a feminine silhouette that makes every moment feel effortlessly luxurious.

From intimate gatherings to elegant everyday occasions, this is more than an outfit — it’s a statement of timeless femininity.

Top (Shirt/Blouse):

Bust Circumference: ± 105–110 cm
Garment Length: ± 65–70 cm
Sleeve Length: ± 55–57 cm

Bottom (Tiered Skirt):

Skirt Length: ± 92–95 cm
Waist Circumference: ± 60–105 cm
(Fully elasticated waistband)
Hip/Bottom: Wide, flowing tiered umbrella-style ruffles for an elegant and voluminous silhouette.

Suitable and comfortable for a body weight of approximately 45–75 kg (fits sizes L–XL).

Made from Rayon Twill fabric, known for its soft, flowy drape, cool and breathable feel, and excellent sweat-absorbing properties.', 650000.00, '/uploads-elkon/1789028894290-875247093.png', '["/uploads-elkon/1789028894290-875247093.png"]', 5, 'active', 0, 14) ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), base_price=VALUES(base_price), image=VALUES(image), images=VALUES(images), category_id=VALUES(category_id), status=VALUES(status), is_preorder=VALUES(is_preorder), preorder_days=VALUES(preorder_days);
INSERT INTO products (id, name, description, base_price, image, images, category_id, status, is_preorder, preorder_days) VALUES (3, 'Premium English Flower Dress', 'A relaxed-All Sized Toyobo catoon dress with flowy . Made from high-grade organic toyobo catoon premium that breathes exceptionally well under the sun. Styled with premium flower pattern. It''s good for all occasion.

Ukuran S (Small)
Lingkar Dada: 88 – 92 cm
Panjang Dress: 135 – 138 cm
Panjang Lengan: 54 – 56 cm
Estimasi Berat Badan: 45 – 52 kg

Ukuran M (Medium)
Lingkar Dada: 94 – 96 cm
Panjang Dress: 138 – 140 cm
Panjang Lengan: 55 – 57 cm
Estimasi Berat Badan: 53 – 59 kg

Ukuran L (Large)
Lingkar Dada: 100 – 104 cm
Panjang Dress: 140 cm
Panjang Lengan: 56 – 58 cm
Estimasi Berat Badan: 60 – 70 kg

Ukuran XL (Extra Large)
Lingkar Dada: 106 – 110 cm
Panjang Dress: 140 – 142 cm
Panjang Lengan: 57 – 59 cm
Estimasi Berat Badan: 70 – 80 kg', 1500000.00, '/uploads-elkon/1788350646972-152901405.JPG', '["/uploads-elkon/1788350646972-152901405.JPG"]', 5, 'active', 0, 14) ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), base_price=VALUES(base_price), image=VALUES(image), images=VALUES(images), category_id=VALUES(category_id), status=VALUES(status), is_preorder=VALUES(is_preorder), preorder_days=VALUES(preorder_days);
INSERT INTO products (id, name, description, base_price, image, images, category_id, status, is_preorder, preorder_days) VALUES (2, 'Luxury Outer Magnolia flower', 'A sophisticated and feminine dress crafted from premium silk, featuring a soft, luxurious texture and an elegant fluid drape. The delicate floral print in soft blush orange, ivory, and sage green creates a romantic yet refined aesthetic.

Designed with long sleeves, a defined waist, and an adjustable waist tie, the dress beautifully enhances the silhouette while maintaining effortless comfort. The flowing maxi-length skirt adds graceful movement, making it perfect for special occasions, elegant gatherings, and elevated everyday styling.

Key Details:
• Premium Silk Fabric
• Exclusive Floral Print
• Elegant Long Sleeves
• Waist Tie Detail
• Flowy Maxi Silhouette
• Soft & Luxurious Feel
• Feminine & Sophisticated Look

Size S (Small)
Bust: 88 – 92 cm
Dress Length: 135 – 138 cm
Sleeve Length: 54 – 56 cm
Estimated Weight: 45 – 52 kg

Size M (Medium)Bust: 94 – 96 cm
Dress Length: 138 – 140 cm
Sleeve Length: 55 – 57 cm
Estimated Weight: 53 – 59 kg

Size L (Large)Bust: 100 – 104 cm
Dress Length: 140 cm
Sleeve Length: 56 – 58 cm
Estimated Weight: 60 – 70 kg

Size XL (Extra Large)Bust: 106 – 110 cm
Dress Length: 140 – 142 cm
Sleeve Length: 57 – 59 cm
Estimated Weight: 70 – 80 kg
', 1600000.00, '/uploads-elkon/1788351739298-570296757.png', '["/uploads-elkon/1788351739298-570296757.png"]', 5, 'active', 0, 14) ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), base_price=VALUES(base_price), image=VALUES(image), images=VALUES(images), category_id=VALUES(category_id), status=VALUES(status), is_preorder=VALUES(is_preorder), preorder_days=VALUES(preorder_days);
INSERT INTO products (id, name, description, base_price, image, images, category_id, status, is_preorder, preorder_days) VALUES (1, 'Sage Green Floral Blouse', 'Sage Green Floral Blouse

A feminine blouse featuring a soft sage green base adorned with delicate floral prints in dusty pink, mauve, and cream. The harmonious color palette creates a soft, elegant, and sophisticated look.

Designed with a classic collar, front button closure, and three-quarter sleeves, this versatile blouse offers effortless styling for both casual and semi-formal occasions.

Size S (Small)
Bust: 88 – 92 cm
Dress Length: 135 – 138 cm
Sleeve Length: 54 – 56 cm
Estimated Weight: 45 – 52 kg

Size M (Medium)
Bust: 94 – 96 cm
Dress Length: 138 – 140 cm
Sleeve Length: 55 – 57 cm
Estimated Weight: 53 – 59 kg
Size L (Large)Bust: 100 – 104 cm
Dress Length: 140 cm
Sleeve Length: 56 – 58 cm
Estimated Weight: 60 – 70 kg

Size XL (Extra Large)
Bust: 106 – 110 cm
Dress Length: 140 – 142 cm
Sleeve Length: 57 – 59 cm
Estimated Weight: 70 – 80 kg', 980000.00, '/uploads-elkon/1788354026840-617531064.JPG', '["/uploads-elkon/1788354026840-617531064.JPG"]', 3, 'active', 0, 14) ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), base_price=VALUES(base_price), image=VALUES(image), images=VALUES(images), category_id=VALUES(category_id), status=VALUES(status), is_preorder=VALUES(is_preorder), preorder_days=VALUES(preorder_days);

-- Variants
INSERT INTO product_variants (product_id, size, color, sku, price_override, stock, image) VALUES (10, '1', 'warna warni', '01-A', NULL, 9, NULL) ON DUPLICATE KEY UPDATE id=id;
INSERT INTO product_variants (product_id, size, color, sku, price_override, stock, image) VALUES (9, 'Large', 'Deep Olive', 'DeepolvBag-01', NULL, 30, NULL) ON DUPLICATE KEY UPDATE id=id;
INSERT INTO product_variants (product_id, size, color, sku, price_override, stock, image) VALUES (8, 'Large', 'Black', 'BlackL-01', NULL, 40, NULL) ON DUPLICATE KEY UPDATE id=id;
INSERT INTO product_variants (product_id, size, color, sku, price_override, stock, image) VALUES (7, 'Medium', 'Color: Chocolate Brown', 'Coco-01', NULL, 40, NULL) ON DUPLICATE KEY UPDATE id=id;
INSERT INTO product_variants (product_id, size, color, sku, price_override, stock, image) VALUES (6, 'All SIze', 'Soft Yellow', 'Aurelia-01', 590000.00, 20, NULL) ON DUPLICATE KEY UPDATE id=id;
INSERT INTO product_variants (product_id, size, color, sku, price_override, stock, image) VALUES (6, 'All Size', 'Soft Pink', 'Aurelia-02', 590000.00, 20, NULL) ON DUPLICATE KEY UPDATE id=id;
INSERT INTO product_variants (product_id, size, color, sku, price_override, stock, image) VALUES (5, 'All Size', 'Soft Pink', 'Rayon Flow-01', 650000.00, 20, NULL) ON DUPLICATE KEY UPDATE id=id;
INSERT INTO product_variants (product_id, size, color, sku, price_override, stock, image) VALUES (5, 'All Size', 'Soft Yellow', 'Rayon Flow-02', 650000.00, 20, NULL) ON DUPLICATE KEY UPDATE id=id;
INSERT INTO product_variants (product_id, size, color, sku, price_override, stock, image) VALUES (5, 'All size', 'Soft Purple', 'Rayon Flow-03', 650000.00, 20, NULL) ON DUPLICATE KEY UPDATE id=id;
INSERT INTO product_variants (product_id, size, color, sku, price_override, stock, image) VALUES (5, 'All Size', 'Soft Blue', 'Rayon Flow-04', 650000.00, 20, NULL) ON DUPLICATE KEY UPDATE id=id;
INSERT INTO product_variants (product_id, size, color, sku, price_override, stock, image) VALUES (3, 'S', 'Soft Pink', 'ELK-VAR-831', 1499999.00, 200, NULL) ON DUPLICATE KEY UPDATE id=id;
INSERT INTO product_variants (product_id, size, color, sku, price_override, stock, image) VALUES (3, 'M', 'Soft Pink', 'ELK-VAR-675', 1499999.00, 300, NULL) ON DUPLICATE KEY UPDATE id=id;
INSERT INTO product_variants (product_id, size, color, sku, price_override, stock, image) VALUES (3, 'L', 'Soft Pink', 'ELK-VAR-885', 1499999.00, 200, NULL) ON DUPLICATE KEY UPDATE id=id;
INSERT INTO product_variants (product_id, size, color, sku, price_override, stock, image) VALUES (3, 'XL', 'Soft Pink', 'ELK-VAR-296', 1499999.00, 95, NULL) ON DUPLICATE KEY UPDATE id=id;
INSERT INTO product_variants (product_id, size, color, sku, price_override, stock, image) VALUES (2, 'S', 'Soft Orange', 'Magnolia-01', 1600000.00, 100, NULL) ON DUPLICATE KEY UPDATE id=id;
INSERT INTO product_variants (product_id, size, color, sku, price_override, stock, image) VALUES (2, 'M', 'Soft Orange', 'Magnolia-02', 1600000.00, 300, NULL) ON DUPLICATE KEY UPDATE id=id;
INSERT INTO product_variants (product_id, size, color, sku, price_override, stock, image) VALUES (2, 'L', 'Soft Orange', 'Magnolia-03', 1600000.00, 200, NULL) ON DUPLICATE KEY UPDATE id=id;
INSERT INTO product_variants (product_id, size, color, sku, price_override, stock, image) VALUES (2, 'XL', 'Soft Orange', 'Outer-FLower-04', 1600000.00, 100, NULL) ON DUPLICATE KEY UPDATE id=id;
INSERT INTO product_variants (product_id, size, color, sku, price_override, stock, image) VALUES (1, 'S', 'Sage Green Floral Blouse', 'Floral Blouse-01', 980000.00, 100, NULL) ON DUPLICATE KEY UPDATE id=id;
INSERT INTO product_variants (product_id, size, color, sku, price_override, stock, image) VALUES (1, 'M', 'Sage Green Floral Blouse', 'Floral Blouse-02', 980000.00, 200, NULL) ON DUPLICATE KEY UPDATE id=id;
INSERT INTO product_variants (product_id, size, color, sku, price_override, stock, image) VALUES (1, 'L', 'Sage Green Floral Blouse', 'Floral Blouse-03', 980000.00, 200, NULL) ON DUPLICATE KEY UPDATE id=id;
INSERT INTO product_variants (product_id, size, color, sku, price_override, stock, image) VALUES (1, 'XL', 'Sage Green Floral Blouse', 'Floral Blouse-04', 980000.00, 100, NULL) ON DUPLICATE KEY UPDATE id=id;

-- Banners
INSERT INTO banners (id, title, subtitle, image, link_url, status) VALUES (1, 'Beautiful dress to be Iconic', NULL, '/uploads-elkon/1791964219663-221845757.png', '/shop', 'active') ON DUPLICATE KEY UPDATE title=VALUES(title), subtitle=VALUES(subtitle), image=VALUES(image), link_url=VALUES(link_url), status=VALUES(status);

-- Info bisnis non-rahasia
INSERT INTO settings (key_name, value_text) VALUES ('whatsapp_number', '6287865407492') ON DUPLICATE KEY UPDATE value_text=value_text;
INSERT INTO settings (key_name, value_text) VALUES ('preorder_policy', '{"items":["Estimasi produksi: 7–14 hari kerja, kalau orderan terlalu banyak maksimal 40 hari kerja.","Pembayaran dilakukan sebelum pesanan diproses.","Pesanan yang sudah masuk produksi tidak dapat dibatalkan.","Perubahan ukuran/warna maksimal 1x24 jam setelah pembayaran.","Produk dikirim setelah proses produksi dan QC selesai.","Penukaran hanya berlaku untuk kesalahan pengiriman atau cacat produksi dengan video unboxing."],"disclaimer":"By placing an order, you agree to our Pre-Order Policy. ✨"}') ON DUPLICATE KEY UPDATE value_text=value_text;

SET FOREIGN_KEY_CHECKS=1;
