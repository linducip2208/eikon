-- Migration: perbaiki hash password admin default yang rusak
--
-- Latar belakang: seed di database.sql versi lama memuat hash bcrypt yang
-- TIDAK cocok dengan password "admin123" (walau komentarnya menyebut demikian),
-- sehingga admin hasil instalasi baru tidak bisa login ("Email atau password salah").
--
-- SQL ini HANYA mengubah baris admin yang passwordnya masih berupa hash rusak
-- tersebut. Jika password admin sudah pernah diganti, baris tidak tersentuh
-- (aman diulang / idempotent).
--
-- Cara pakai:
--   mysql -u root --default-character-set=utf8mb4 elkon_db < backend/sql/migration_admin_password.sql

UPDATE users
SET password = '$2a$12$i6zVIXcznxOJGbLOSlarD.S.zafFMM9OGL2zMqZOfKVXXYL7eXzP.'
WHERE email = 'admin@elkon.com'
  AND password = '$2a$10$tMhI3Q93l6M.8Jp7s9KqBuxm8n9Qx7L5pX5s6uA8EwG8oD.R1f1wK';
