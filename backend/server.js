const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
require('dotenv').config();

// --- SERVER LOG BUFFER (untuk tab "Log" di dashboard admin) ---
// Semua output console di-tee ke:
//   1) ring buffer in-memory (100 baris terakhir) -> dibaca endpoint /api/admin/logs
//   2) file backend/logs/server.log (rotasi di 1 MB -> server.log.old)
// Tujuannya supaya log bisa dilihat dari browser di hosting yang tidak
// menyediakan akses terminal / file log ke pengguna.
const LOG_BUFFER_MAX = 100;
const LOG_LINE_MAX = 2000;
const LOG_FILE_MAX_BYTES = 1024 * 1024;
const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'server.log');
const logBuffer = [];

function stringifyLogArg(value) {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.stack || value.message;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function appendLogFile(line) {
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    try {
      if (fs.statSync(LOG_FILE).size > LOG_FILE_MAX_BYTES) {
        fs.renameSync(LOG_FILE, `${LOG_FILE}.old`);
      }
    } catch {
      // file belum ada -> langsung append di bawah
    }
    fs.appendFileSync(LOG_FILE, `${line}\n`);
  } catch {
    // File log bersifat opsional (mis. disk read-only) — jangan sampai melempar error
  }
}

function recordLog(level, args) {
  try {
    const message = args.map(stringifyLogArg).join(' ').slice(0, LOG_LINE_MAX);
    const entry = { time: new Date().toISOString(), level, message };
    logBuffer.push(entry);
    if (logBuffer.length > LOG_BUFFER_MAX) logBuffer.shift();
    appendLogFile(`[${entry.time}] [${level.toUpperCase()}] ${message}`);
  } catch {
    // logging tidak boleh pernah menyebabkan error aplikasi
  }
}

// Muat riwayat log terakhir dari file saat server dinyalakan,
// supaya isi tab "Log" tidak hilang setiap restart aplikasi.
function loadRecentLogsFromFile(maxEntries = 100) {
  try {
    if (!fs.existsSync(LOG_FILE)) return;
    const lines = fs.readFileSync(LOG_FILE, 'utf8').split(/\r?\n/).filter(Boolean).slice(-maxEntries);
    for (const line of lines) {
      const match = line.match(/^\[([^\]]+)\] \[([A-Z]+)\] ([\s\S]*)$/);
      if (!match) continue;
      const level = match[2].toLowerCase();
      logBuffer.push({
        time: match[1],
        level: ['info', 'warn', 'error'].includes(level) ? level : 'info',
        message: match[3].slice(0, LOG_LINE_MAX),
      });
    }
  } catch {
    // Riwayat log bersifat opsional — jangan sampai menghambat server start
  }
}
loadRecentLogsFromFile();

// Tee console.log/warn/error ke buffer — output terminal tetap seperti biasa
['log', 'warn', 'error'].forEach((method) => {
  const original = console[method].bind(console);
  console[method] = (...args) => {
    recordLog(method === 'log' ? 'info' : method, args);
    original(...args);
  };
});

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// trust proxy lapis pertama (Nginx/cPanel Passenger) agar req.ip = IP klien asli,
// dibutuhkan rate limiter agar tidak semua request terbaca 127.0.0.1
app.set('trust proxy', 1);
// CORS whitelist: hanya domain toko + dev lokal. Tambah domain via env CORS_ORIGINS
// (koma, mis. CORS_ORIGINS=https://toko.com,https://admin.toko.com)
const allowedOrigins = (process.env.CORS_ORIGINS ||
  'http://localhost:5173,http://127.0.0.1:5173,http://eikon.test,http://eikon.test:5173,https://www.eliteikon.com,https://elkon.whitelabel.co.id'
).split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Origin tidak diizinkan oleh CORS'));
  },
}));
// `verify` menyimpan raw body — dipakai memvalidasi X-Callback-Signature Tripay
// (HMAC-SHA256 dihitung dari byte body asli, bukan hasil parse ulang).
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
// iPaymu mengirim callback dalam format x-www-form-urlencoded (default) atau JSON
app.use(express.urlencoded({ extended: true }));
app.use('/uploads-elkon', express.static(path.join(__dirname, 'uploads-elkon')));

// Database connection pool
let pool;
async function connectDb() {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'elkon_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    const connection = await pool.getConnection();
    console.log('Successfully connected to MySQL database.');
    connection.release();
    // Tripwire: peringatkan jika password admin masih default
    try {
      const [admins] = await pool.query("SELECT password FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1");
      if (admins.length > 0 && (await bcrypt.compare('admin123', admins[0].password))) {
        console.warn('KEAMANAN: password admin masih default (admin123). Segera ganti via menu admin!');
      }
    } catch (_) { /* abaikan: tabel belum ada saat migrasi awal */ }
  } catch (error) {
    console.error('MySQL connection failure:', error.message);
    console.log('Retrying MySQL connection in 5 seconds...');
    setTimeout(connectDb, 5000);
  }
}
connectDb();

// Multer file upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads-elkon'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 }, // maksimal 5MB per file
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed!'));
    }
  },
});

// Verifikasi magic bytes gambar (ekstensi bisa dipalsukan) — hapus file yang tidak valid
function verifyUploadedImage(file) {
  const ext = path.extname(file.filename).toLowerCase();
  let header;
  try {
    const fd = fs.openSync(file.path, 'r');
    header = Buffer.alloc(12);
    fs.readSync(fd, header, 0, 12, 0);
    fs.closeSync(fd);
  } catch (_) {
    return false;
  }
  let ok = false;
  if (ext === '.jpg' || ext === '.jpeg') {
    ok = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  } else if (ext === '.png') {
    ok = header.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  } else if (ext === '.gif') {
    const sig = header.slice(0, 6).toString('ascii');
    ok = sig === 'GIF87a' || sig === 'GIF89a';
  } else if (ext === '.webp') {
    ok = header.slice(0, 4).toString('ascii') === 'RIFF' && header.slice(8, 12).toString('ascii') === 'WEBP';
  }
  if (!ok) {
    try { fs.unlinkSync(file.path); } catch (_) { /* abaikan */ }
  }
  return ok;
}

// Rate limiter sederhana tanpa dependensi (sliding window per IP+path)
const rateBuckets = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, stamps] of rateBuckets) {
    const fresh = stamps.filter((t) => now - t < 15 * 60 * 1000);
    if (fresh.length === 0) rateBuckets.delete(key);
    else rateBuckets.set(key, fresh);
  }
}, 10 * 60 * 1000).unref();
function rateLimit({ windowMs, max, message }) {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.ip}:${req.path}`;
    const stamps = (rateBuckets.get(key) || []).filter((t) => now - t < windowMs);
    if (stamps.length >= max) {
      return res.status(429).json({ success: false, message: message || 'Terlalu banyak permintaan. Coba lagi nanti.' });
    }
    stamps.push(now);
    rateBuckets.set(key, stamps);
    next();
  };
}
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Terlalu banyak percobaan login. Coba lagi 15 menit lagi.' });
const orderLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60 });
const callbackLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
const contactLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 30 });

// Auth Middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ success: false, message: 'Token akses diperlukan' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Format otorisasi tidak valid' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'elkon_secret_key_2026_jwt_token_auth');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Token tidak valid atau kedaluwarsa' });
  }
};

// --- AUTH ROUTES ---

// POST /api/auth/register - DINONAKTIFKAN: admin dibuat via seed database.
// Dibiarkan sebagai endpoint tertutup agar tidak ada yang bisa mendaftar sebagai admin.
app.post('/api/auth/register', async (req, res) => {
  return res.status(403).json({ success: false, message: 'Pendaftaran akun baru dinonaktifkan' });
});

// POST /api/auth/login
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email dan password wajib diisi' });
  }

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'elkon_secret_key_2026_jwt_token_auth',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login berhasil',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem' });
  }
});

// GET /api/auth/profile
app.get('/api/auth/profile', verifyToken, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
    res.json({ success: true, user: users[0] });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem' });
  }
});

// PUT /api/auth/profile (Admin) - ubah nama & email admin
app.put('/api/auth/profile', verifyToken, async (req, res) => {
  const { name, email } = req.body || {};
  const cleanName = String(name || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();

  if (!cleanName) {
    return res.status(400).json({ success: false, message: 'Nama wajib diisi' });
  }
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ success: false, message: 'Format email tidak valid' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id <> ?', [cleanEmail, req.user.id]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email sudah dipakai akun lain' });
    }
    await pool.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [cleanName, cleanEmail, req.user.id]);
    res.json({
      success: true,
      message: 'Profil admin berhasil diperbarui. Login berikutnya memakai email baru.',
      user: { id: req.user.id, name: cleanName, email: cleanEmail },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui profil' });
  }
});

// PUT /api/auth/password (Admin) - ganti password (wajib tahu password lama)
app.put('/api/auth/password', verifyToken, async (req, res) => {
  const currentPassword = String((req.body || {}).current_password || '');
  const newPassword = String((req.body || {}).new_password || '');

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Password lama dan password baru wajib diisi' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'Password baru minimal 8 karakter' });
  }

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Password lama salah' });
    }
    const isSame = await bcrypt.compare(newPassword, users[0].password);
    if (isSame) {
      return res.status(400).json({ success: false, message: 'Password baru tidak boleh sama dengan password lama' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);
    res.json({ success: true, message: 'Password berhasil diubah. Silakan login ulang.' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengubah password' });
  }
});


// --- FILE UPLOAD ROUTE ---
app.post('/api/upload', verifyToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Tidak ada gambar yang diunggah' });
  }
  if (!verifyUploadedImage(req.file)) {
    return res.status(400).json({ success: false, message: 'File gambar tidak valid' });
  }
  const relativePath = `/uploads-elkon/${req.file.filename}`;
  res.json({
    success: true,
    message: 'Gambar berhasil diunggah',
    imageUrl: relativePath,
  });
});

// POST /api/upload-multiple (Admin)
app.post('/api/upload-multiple', verifyToken, upload.array('images', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'Tidak ada gambar yang diunggah' });
  }
  for (const file of req.files) {
    if (!verifyUploadedImage(file)) {
      return res.status(400).json({ success: false, message: 'Salah satu file gambar tidak valid' });
    }
  }
  const imageUrls = req.files.map((file) => `/uploads-elkon/${file.filename}`);
  res.json({
    success: true,
    message: 'Gambar berhasil diunggah',
    imageUrls,
  });
});


// --- CATEGORIES ROUTES ---

// GET /api/categories
app.get('/api/categories', async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(550).json({ success: false, message: 'Gagal mengambil kategori' });
  }
});

// POST /api/categories (Admin)
app.post('/api/categories', verifyToken, async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM categories WHERE name = ?', [name.trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Kategori sudah terdaftar' });
    }

    const [result] = await pool.query('INSERT INTO categories (name) VALUES (?)', [name.trim()]);
    res.status(201).json({
      success: true,
      message: 'Kategori berhasil dibuat',
      data: { id: result.insertId, name: name.trim() },
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat kategori' });
  }
});

// PUT /api/categories/:id (Admin)
app.put('/api/categories/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM categories WHERE name = ? AND id != ?', [name.trim(), id]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Nama kategori sudah digunakan' });
    }

    const [result] = await pool.query('UPDATE categories SET name = ? WHERE id = ?', [name.trim(), id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }

    res.json({ success: true, message: 'Kategori berhasil diperbarui' });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui kategori' });
  }
});

// DELETE /api/categories/:id (Admin)
app.delete('/api/categories/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }
    res.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus kategori' });
  }
});


// --- CONTACTS ROUTES ---

// POST /api/contacts (Public)
app.post('/api/contacts', contactLimiter, async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Nama, email, dan pesan wajib diisi' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO contacts (name, email, message, status) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim(), message.trim(), 'unread']
    );
    res.status(201).json({
      success: true,
      message: 'Pesan Anda berhasil dikirim. Terima kasih!',
      data: { id: result.insertId },
    });
  } catch (error) {
    console.error('Submit contact error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengirim pesan' });
  }
});

// GET /api/contacts (Admin)
app.get('/api/contacts', verifyToken, async (req, res) => {
  try {
    const [contacts] = await pool.query('SELECT * FROM contacts ORDER BY id DESC');
    res.json({ success: true, data: contacts });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(550).json({ success: false, message: 'Gagal mengambil daftar kontak' });
  }
});

// PUT /api/contacts/:id (Admin)
app.put('/api/contacts/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ success: false, message: 'Status wajib diisi' });
  }

  try {
    const [result] = await pool.query('UPDATE contacts SET status = ? WHERE id = ?', [status, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Pesan tidak ditemukan' });
    }
    res.json({ success: true, message: 'Status pesan berhasil diperbarui' });
  } catch (error) {
    console.error('Update contact status error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui status pesan' });
  }
});

// DELETE /api/contacts/:id (Admin)
app.delete('/api/contacts/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM contacts WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Pesan tidak ditemukan' });
    }
    res.json({ success: true, message: 'Pesan berhasil dihapus' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus pesan' });
  }
});


// --- BANNERS ROUTES ---

// GET /api/banners
app.get('/api/banners', async (req, res) => {
  try {
    const [banners] = await pool.query("SELECT * FROM banners WHERE status = 'active' ORDER BY id ASC");
    res.json({ success: true, data: banners });
  } catch (error) {
    console.error('Get public banners error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil banner' });
  }
});

// GET /api/banners/admin
app.get('/api/banners/admin', verifyToken, async (req, res) => {
  try {
    const [banners] = await pool.query('SELECT * FROM banners ORDER BY id DESC');
    res.json({ success: true, data: banners });
  } catch (error) {
    console.error('Get admin banners error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil banner admin' });
  }
});

// POST /api/banners (Admin)
app.post('/api/banners', verifyToken, async (req, res) => {
  const { title, subtitle, image, link_url, status } = req.body;
  if (!title || !image) {
    return res.status(400).json({ success: false, message: 'Judul banner dan gambar wajib diisi' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO banners (title, subtitle, image, link_url, status) VALUES (?, ?, ?, ?, ?)',
      [title.trim(), subtitle ? subtitle.trim() : '', image.trim(), link_url || '/shop', status || 'active']
    );
    res.status(201).json({
      success: true,
      message: 'Banner berhasil dibuat',
      data: { id: result.insertId },
    });
  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat banner' });
  }
});

// PUT /api/banners/:id (Admin)
app.put('/api/banners/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { title, subtitle, image, link_url, status } = req.body;
  if (!title || !image) {
    return res.status(400).json({ success: false, message: 'Judul banner dan gambar wajib diisi' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE banners SET title = ?, subtitle = ?, image = ?, link_url = ?, status = ? WHERE id = ?',
      [title.trim(), subtitle ? subtitle.trim() : '', image.trim(), link_url || '/shop', status || 'active', id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Banner tidak ditemukan' });
    }
    res.json({ success: true, message: 'Banner berhasil diperbarui' });
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui banner' });
  }
});

// DELETE /api/banners/:id (Admin)
app.delete('/api/banners/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM banners WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Banner tidak ditemukan' });
    }
    res.json({ success: true, message: 'Banner berhasil dihapus' });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus banner' });
  }
});


// GET /api/version (Public) - penanda build yang live di server (untuk verifikasi deploy)
app.get('/api/version', (req, res) => {
  res.json({ success: true, build: '2026-10-24-paypal-fix', node: process.version });
});

// GET /api/payment-methods (Public) - daftar gateway aktif untuk dipilih pelanggan di checkout.
// Tidak pernah mengembalikan kredensial — hanya status kesiapan + info tampil.
app.get('/api/payment-methods', async (req, res) => {
  try {
    const [tripayEnabled, paypalEnabled] = await Promise.all([isGatewayEnabled('tripay'), isGatewayEnabled('paypal')]);
    const [tripayReady, paypalReady] = await Promise.all([isTripayConfigured(), isPaypalConfigured()]);
    const { rate, currency } = await getPaypalConfig();
    res.json({
      success: true,
      data: {
        tripay: { enabled: tripayEnabled && tripayReady },
        paypal: { enabled: paypalEnabled && paypalReady, currency, rate },
      },
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil metode pembayaran' });
  }
});

// --- SETTINGS ROUTES ---

// GET /api/settings (Public - tanpa kredensial payment gateway)
app.get('/api/settings', async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT key_name, value_text FROM settings WHERE key_name NOT LIKE 'tripay%' AND key_name NOT LIKE 'paypal%'"
    );
    const settingsMap = {};
    rows.forEach(r => {
      settingsMap[r.key_name] = r.value_text;
    });
    res.json({ success: true, data: settingsMap });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil pengaturan' });
  }
});

// GET /api/settings/admin (Admin - menyertakan kredensial payment gateway)
app.get('/api/settings/admin', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT key_name, value_text FROM settings');
    const settingsMap = {};
    rows.forEach(r => {
      settingsMap[r.key_name] = r.value_text;
    });
    res.json({ success: true, data: settingsMap });
  } catch (error) {
    console.error('Get admin settings error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil pengaturan' });
  }
});

// PUT /api/settings (Admin)
app.put('/api/settings', verifyToken, async (req, res) => {
  const settingsObj = req.body; // e.g. { whatsapp_number: '62...' } atau { tripay_merchant_code: '...' }
  if (!settingsObj || Object.keys(settingsObj).length === 0) {
    return res.status(400).json({ success: false, message: 'Data pengaturan tidak boleh kosong' });
  }

  // Validasi khusus pengaturan payment gateway (Tripay) & URL
  for (const [key, val] of Object.entries(settingsObj)) {
    const valueText = typeof val === 'string' ? val.trim() : String(val ?? '');
    if (key === 'tripay_env' && valueText && !['sandbox', 'production'].includes(valueText.toLowerCase())) {
      return res.status(400).json({ success: false, message: "Mode Tripay harus 'sandbox' atau 'production'" });
    }
    if (key === 'paypal_env' && valueText && !['sandbox', 'production'].includes(valueText.toLowerCase())) {
      return res.status(400).json({ success: false, message: "Mode PayPal harus 'sandbox' atau 'production'" });
    }
    if ((key === 'tripay_enabled' || key === 'paypal_enabled') && valueText && !['0', '1'].includes(valueText)) {
      return res.status(400).json({ success: false, message: 'Status aktif gateway harus 0 atau 1' });
    }
    if (key === 'paypal_rate' && valueText) {
      const rate = Number(valueText);
      if (!Number.isFinite(rate) || rate < 500 || rate > 1000000) {
        return res.status(400).json({ success: false, message: 'Kurs PayPal (IDR per 1 USD) harus antara 500 dan 1000000' });
      }
    }
    if (
      (key === 'site_url' || key === 'tripay_callback_url') &&
      valueText &&
      !/^https?:\/\//i.test(valueText)
    ) {
      return res.status(400).json({
        success: false,
        message: `URL ${key === 'site_url' ? 'Website Toko' : 'Callback'} harus diawali http:// atau https://`,
      });
    }
    if (key === 'tripay_channel' && valueText && !/^[a-z0-9_]+$/i.test(valueText)) {
      return res.status(400).json({ success: false, message: 'Kode channel Tripay hanya boleh berisi huruf, angka, dan garis bawah (cth. QRIS, BRIVA)' });
    }
    if (key === 'tripay_expired_minutes' && valueText) {
      const minutes = parseInt(valueText, 10);
      if (Number.isNaN(minutes) || minutes < 10 || minutes > 4320) {
        return res.status(400).json({ success: false, message: 'Masa berlaku pembayaran Tripay harus antara 10 dan 4320 menit' });
      }
    }
    if (key === 'business_email' && valueText && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valueText)) {
      return res.status(400).json({ success: false, message: 'Format email bisnis tidak valid' });
    }
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    for (const [key, val] of Object.entries(settingsObj)) {
      let valueText = typeof val === "string" ? val.trim() : String(val);
      if (key === 'tripay_env' || key === 'paypal_env') valueText = valueText.toLowerCase();
      if (key === 'tripay_channel') valueText = valueText.toUpperCase();
      if (key === 'site_url' || key === 'tripay_callback_url') valueText = valueText.replace(/\/+$/, '');
      await connection.query(
        'INSERT INTO settings (key_name, value_text) VALUES (?, ?) ON DUPLICATE KEY UPDATE value_text = ?',
        [key, valueText, valueText]
      );
    }
    await connection.commit();
    connection.release();
    // Kredensial/mode PayPal berubah -> buang token cache agar otentikasi berikutnya langsung pakai nilai baru
    if (Object.keys(settingsObj).some((k) => k === 'paypal_env' || k === 'paypal_client_id' || k === 'paypal_secret')) {
      paypalTokenCache = { key: '', token: '', expiresAt: 0 };
    }
    res.json({ success: true, message: 'Pengaturan berhasil diperbarui' });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui pengaturan' });
  }
});


// --- ADMIN DYNAMIC STATS ROUTE ---
app.get('/api/admin/stats', verifyToken, async (req, res) => {
  try {
    const [[{ totalProducts }]] = await pool.query('SELECT COUNT(*) as totalProducts FROM products');
    const [[{ outOfStockCount }]] = await pool.query('SELECT COUNT(*) as outOfStockCount FROM product_variants WHERE stock = 0');
    const [[{ totalStockCount }]] = await pool.query('SELECT COALESCE(SUM(stock), 0) as totalStockCount FROM product_variants');
    const [[{ totalCategories }]] = await pool.query('SELECT COUNT(*) as totalCategories FROM categories');
    const [[{ unreadContacts }]] = await pool.query("SELECT COUNT(*) as unreadContacts FROM contacts WHERE status = 'unread'");
    const [[{ totalContacts }]] = await pool.query("SELECT COUNT(*) as totalContacts FROM contacts");
    const [[{ totalBanners }]] = await pool.query("SELECT COUNT(*) as totalBanners FROM banners");
    const [[{ totalOrders }]] = await pool.query("SELECT COUNT(*) as totalOrders FROM orders");
    const [[{ pendingOrders }]] = await pool.query("SELECT COUNT(*) as pendingOrders FROM orders WHERE status = 'pending'");

    res.json({
      success: true,
      stats: {
        totalProducts,
        outOfStockCount,
        totalStockCount,
        totalCategories,
        unreadContacts,
        totalContacts,
        totalBanners,
        totalOrders,
        pendingOrders
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data statistik dashboard' });
  }
});

// GET /api/admin/logs (Admin) - ring buffer log server untuk tab "Log" di dashboard
// Mendukung ?limit= (default 100), ?level=info|warn|error, ?search= (substring).
// Nilai sensitif tidak pernah masuk ke log (API key selalu disamarkan di pemanggilnya).
app.get('/api/admin/logs', verifyToken, (req, res) => {
  try {
    const limitRaw = parseInt(req.query.limit, 10);
    const limit = Math.min(Math.max(Number.isNaN(limitRaw) ? 100 : limitRaw, 1), LOG_BUFFER_MAX);
    const level = String(req.query.level || '').toLowerCase();
    const search = String(req.query.search || '').trim().toLowerCase();

    let entries = logBuffer;
    if (['info', 'warn', 'error'].includes(level)) {
      entries = entries.filter((entry) => entry.level === level);
    }
    if (search) {
      entries = entries.filter((entry) => entry.message.toLowerCase().includes(search));
    }

    res.json({
      success: true,
      data: entries.slice(-limit),
      total: logBuffer.length,
      filtered: entries.length,
      bufferLimit: LOG_BUFFER_MAX,
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil log server' });
  }
});


// --- PRODUCTS & VARIANTS CRUD ROUTES ---

// GET /api/products
app.get('/api/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const categoryId = req.query.category_id || '';
    const status = req.query.status || '';
    const sort = req.query.sort || 'newest';

    let queryParams = [];
    let countParams = [];

    let whereClauses = [];
    if (search) {
      whereClauses.push('(p.name LIKE ? OR p.description LIKE ?)');
      const searchWild = `%${search}%`;
      queryParams.push(searchWild, searchWild);
      countParams.push(searchWild, searchWild);
    }
    if (categoryId) {
      whereClauses.push('p.category_id = ?');
      queryParams.push(parseInt(categoryId));
      countParams.push(parseInt(categoryId));
    }
    if (status) {
      whereClauses.push('p.status = ?');
      queryParams.push(status);
      countParams.push(status);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as total FROM products p ${whereSql}`;
    const [countResult] = await pool.query(countSql, countParams);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    let orderSql = 'ORDER BY p.id DESC';
    if (sort === 'oldest') {
      orderSql = 'ORDER BY p.id ASC';
    } else if (sort === 'price_asc') {
      orderSql = 'ORDER BY p.base_price ASC';
    } else if (sort === 'price_desc') {
      orderSql = 'ORDER BY p.base_price DESC';
    } else if (sort === 'name_asc') {
      orderSql = 'ORDER BY p.name ASC';
    } else if (sort === 'name_desc') {
      orderSql = 'ORDER BY p.name DESC';
    }

    const mainSql = `
      SELECT p.*, c.name as category,
             COALESCE(SUM(v.stock), 0) as total_stock,
             COUNT(v.id) as variant_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants v ON p.id = v.product_id
      ${whereSql}
      GROUP BY p.id
      ${orderSql}
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limit, offset);

    const [products] = await pool.query(mainSql, queryParams);

    if (products.length > 0) {
      const productIds = products.map(p => p.id);
      const [variants] = await pool.query(
        'SELECT * FROM product_variants WHERE product_id IN (?)',
        [productIds]
      );
      
      products.forEach(p => {
        // Parse images if string
        if (typeof p.images === 'string') {
          try {
            p.images = JSON.parse(p.images);
          } catch (e) {
            p.images = p.image ? [p.image] : [];
          }
        } else if (!Array.isArray(p.images)) {
          p.images = p.image ? [p.image] : [];
        }
        if (p.images.length === 0 && p.image) {
          p.images = [p.image];
        }

        p.variants = variants.filter(v => v.product_id === p.id);
      });
    }

    res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan mengambil produk' });
  }
});

// GET /api/products/:id
app.get('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [products] = await pool.query(
      `SELECT p.*, c.name as category 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`, 
      [id]
    );
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    const product = products[0];
    if (typeof product.images === 'string') {
      try {
        product.images = JSON.parse(product.images);
      } catch (e) {
        product.images = product.image ? [product.image] : [];
      }
    } else if (!Array.isArray(product.images)) {
      product.images = product.image ? [product.image] : [];
    }
    if (product.images.length === 0 && product.image) {
      product.images = [product.image];
    }

    const [variants] = await pool.query('SELECT * FROM product_variants WHERE product_id = ?', [id]);
    product.variants = variants;

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan mengambil detail produk' });
  }
});

// POST /api/products
app.post('/api/products', verifyToken, async (req, res) => {
  const { name, description, base_price, image, images, category_id, status, is_preorder, preorder_days, variants } = req.body;

  if (!name || !base_price || !category_id) {
    return res.status(400).json({ success: false, message: 'Nama, harga dasar, dan kategori wajib diisi' });
  }

  const primaryImage = image || (Array.isArray(images) && images.length > 0 ? images[0] : '');
  const imagesArray = Array.isArray(images) && images.length > 0 ? images : (primaryImage ? [primaryImage] : []);
  const imagesJson = JSON.stringify(imagesArray);

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const [prodResult] = await connection.query(
      `INSERT INTO products (name, description, base_price, image, images, category_id, status, is_preorder, preorder_days) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || '',
        base_price,
        primaryImage,
        imagesJson,
        category_id,
        status || 'active',
        is_preorder ? 1 : 0,
        preorder_days !== undefined && preorder_days !== null ? parseInt(preorder_days) : 14
      ]
    );

    const productId = prodResult.insertId;

    if (variants && Array.isArray(variants) && variants.length > 0) {
      for (const variant of variants) {
        const { size, color, sku, price_override, stock, image: variantImage } = variant;
        if (!size || !color || !sku) {
          throw new Error('Ukuran, warna, dan kode SKU varian wajib diisi');
        }

        const [existingSku] = await connection.query('SELECT id FROM product_variants WHERE sku = ?', [sku]);
        if (existingSku.length > 0) {
          throw new Error(`Kode SKU "${sku}" sudah digunakan oleh varian produk lain.`);
        }

        await connection.query(
          `INSERT INTO product_variants (product_id, size, color, sku, price_override, stock, image) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [productId, size, color, sku, price_override || null, stock || 0, variantImage || null]
        );
      }
    } else {
      const defaultSku = `ELK-${productId}-${Date.now().toString().slice(-4)}`;
      await connection.query(
        `INSERT INTO product_variants (product_id, size, color, sku, price_override, stock, image) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [productId, 'One Size', 'Default', defaultSku, null, 1, null]
      );
    }

    await connection.commit();
    connection.release();

    res.status(201).json({
      success: true,
      message: 'Produk dan varian berhasil dibuat',
      data: { id: productId },
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Create product error:', error);
    res.status(400).json({ success: false, message: error.message || 'Gagal menyimpan produk' });
  }
});

// PUT /api/products/:id
app.put('/api/products/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, description, base_price, image, images, category_id, status, is_preorder, preorder_days, variants } = req.body;

  if (!name || !base_price || !category_id) {
    return res.status(400).json({ success: false, message: 'Nama, harga dasar, dan kategori wajib diisi' });
  }

  const primaryImage = image || (Array.isArray(images) && images.length > 0 ? images[0] : '');
  const imagesArray = Array.isArray(images) && images.length > 0 ? images : (primaryImage ? [primaryImage] : []);
  const imagesJson = JSON.stringify(imagesArray);

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const [prodCheck] = await connection.query('SELECT id FROM products WHERE id = ?', [id]);
    if (prodCheck.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    await connection.query(
      `UPDATE products 
       SET name = ?, description = ?, base_price = ?, image = ?, images = ?, category_id = ?, status = ?, is_preorder = ?, preorder_days = ? 
       WHERE id = ?`,
      [
        name,
        description || '',
        base_price,
        primaryImage,
        imagesJson,
        category_id,
        status || 'active',
        is_preorder ? 1 : 0,
        preorder_days !== undefined && preorder_days !== null ? parseInt(preorder_days) : 14,
        id
      ]
    );

    if (variants && Array.isArray(variants)) {
      for (const variant of variants) {
        const { id: variantId, size, color, sku } = variant;
        if (!size || !color || !sku) {
          throw new Error('Semua varian wajib diisi ukuran, warna, dan kode SKU');
        }

        if (variantId) {
          const [skuCheck] = await connection.query(
            'SELECT id FROM product_variants WHERE sku = ? AND id != ?',
            [sku, variantId]
          );
          if (skuCheck.length > 0) {
            throw new Error(`Kode SKU "${sku}" sudah digunakan oleh varian lain.`);
          }
        } else {
          const [skuCheck] = await connection.query(
            'SELECT id FROM product_variants WHERE sku = ?',
            [sku]
          );
          if (skuCheck.length > 0) {
            throw new Error(`Kode SKU "${sku}" sudah digunakan.`);
          }
        }
      }

      const [currentVariants] = await connection.query('SELECT id FROM product_variants WHERE product_id = ?', [id]);
      const currentIds = currentVariants.map(v => v.id);
      const incomingIds = variants.filter(v => v.id).map(v => v.id);

      const idsToDelete = currentIds.filter(cid => !incomingIds.includes(cid));
      if (idsToDelete.length > 0) {
        await connection.query('DELETE FROM product_variants WHERE id IN (?)', [idsToDelete]);
      }

      for (const variant of variants) {
        const { id: variantId, size, color, sku, price_override, stock, image: variantImage } = variant;
        if (variantId) {
          await connection.query(
            `UPDATE product_variants 
             SET size = ?, color = ?, sku = ?, price_override = ?, stock = ?, image = ? 
             WHERE id = ? AND product_id = ?`,
            [size, color, sku, price_override || null, stock || 0, variantImage || null, variantId, id]
          );
        } else {
          await connection.query(
            `INSERT INTO product_variants (product_id, size, color, sku, price_override, stock, image) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, size, color, sku, price_override || null, stock || 0, variantImage || null]
          );
        }
      }
    }

    await connection.commit();
    connection.release();

    res.json({ success: true, message: 'Produk dan varian berhasil diperbarui' });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Update product error:', error);
    res.status(400).json({ success: false, message: error.message || 'Gagal memperbarui produk' });
  }
});

// DELETE /api/products/:id
app.delete('/api/products/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [prodCheck] = await pool.query('SELECT id FROM products WHERE id = ?', [id]);
    if (prodCheck.length === 0) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ success: true, message: 'Produk berhasil dihapus' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus produk' });
  }
});

// --- TRIPAY PAYMENT GATEWAY (satu-satunya gateway yang dipakai checkout) ---
// Kredensial TIDAK di-hardcode: dibaca dari tabel `settings` dan diatur
// dari dashboard admin (menu Payment Gateway).

async function getTripayConfig() {
  const [rows] = await pool.query(
    "SELECT key_name, value_text FROM settings WHERE key_name IN ('tripay_env', 'tripay_merchant_code', 'tripay_api_key', 'tripay_private_key', 'tripay_channel', 'tripay_expired_minutes', 'tripay_callback_url', 'site_url')"
  );
  const map = {};
  rows.forEach((r) => {
    map[r.key_name] = String(r.value_text || '').trim();
  });

  const isProduction = (map.tripay_env || 'sandbox').toLowerCase() === 'production';
  const defaultBaseUrl = isProduction ? 'https://tripay.co.id/api' : 'https://tripay.co.id/api-sandbox';
  const expiredMinutes = parseInt(map.tripay_expired_minutes, 10);
  return {
    // TRIPAY_BASE_URL hanya untuk debug/testing lokal (opsional) — bukan kredensial
    baseUrl: (process.env.TRIPAY_BASE_URL || defaultBaseUrl).replace(/\/+$/, ''),
    merchantCode: map.tripay_merchant_code || '',
    apiKey: map.tripay_api_key || '',
    privateKey: map.tripay_private_key || '',
    channel: (map.tripay_channel || '').toUpperCase(),
    expiredMinutes: Number.isFinite(expiredMinutes) && expiredMinutes >= 10 ? expiredMinutes : 60,
    siteUrl: (map.site_url || '').replace(/\/+$/, ''),
    callbackUrl: (map.tripay_callback_url || '').replace(/\/+$/, ''),
    isProduction,
  };
}

async function isTripayConfigured() {
  const { merchantCode, apiKey, privateKey, channel } = await getTripayConfig();
  return Boolean(merchantCode && apiKey && privateKey && channel);
}

async function isGatewayEnabled(name) {
  const [rows] = await pool.query('SELECT value_text FROM settings WHERE key_name = ?', [`${name}_enabled`]);
  const value = String((rows[0] && rows[0].value_text) || '').trim();
  // Default: aktif bila belum pernah diatur (migrasi lama tanpa toggle)
  return value === '' ? true : value === '1';
}

// --- PAYPAL (REST API v2, mode redirect: create -> approve -> capture) ---
// PayPal tidak mendukung IDR, nominal dikonversi ke USD memakai kurs
// `paypal_rate` (IDR per 1 USD, diatur admin). Kredensial dari dashboard admin.
async function getPaypalConfig() {
  const [rows] = await pool.query(
    "SELECT key_name, value_text FROM settings WHERE key_name IN ('paypal_env', 'paypal_client_id', 'paypal_secret', 'paypal_webhook_id', 'paypal_rate', 'site_url')"
  );
  const map = {};
  rows.forEach((r) => {
    map[r.key_name] = String(r.value_text || '').trim();
  });

  const isProduction = (map.paypal_env || 'sandbox').toLowerCase() === 'production';
  const defaultBaseUrl = isProduction ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  const rate = Number(map.paypal_rate);
  return {
    // PAYPAL_BASE_URL hanya untuk debug/testing lokal (opsional) — bukan kredensial
    baseUrl: (process.env.PAYPAL_BASE_URL || defaultBaseUrl).replace(/\/+$/, ''),
    clientId: map.paypal_client_id || '',
    secret: map.paypal_secret || '',
    webhookId: map.paypal_webhook_id || '',
    rate: Number.isFinite(rate) && rate >= 500 && rate <= 1000000 ? rate : 16000,
    currency: 'USD',
    siteUrl: (map.site_url || '').replace(/\/+$/, ''),
    isProduction,
  };
}

async function isPaypalConfigured() {
  const { clientId, secret } = await getPaypalConfig();
  return Boolean(clientId && secret);
}

// Konversi IDR -> USD (2 desimal, dibulatkan ke atas per sen agar tidak kurang bayar)
function idrToUsd(amountIdr, rate) {
  return Math.ceil((Number(amountIdr) / rate) * 100) / 100;
}

// Token akses PayPal di-cache di memori sampai kedaluwarsa.
// Cache di-key per environment + client agar ganti mode/kredensial tidak memakai token basi.
let paypalTokenCache = { key: '', token: '', expiresAt: 0 };
async function getPaypalAccessToken() {
  const { baseUrl, clientId, secret, isProduction } = await getPaypalConfig();
  if (!clientId || !secret) {
    const paymentError = new Error('PayPal belum dikonfigurasi. Lengkapi di Admin > Payment Gateway.');
    paymentError.isPaymentError = true;
    throw paymentError;
  }
  const cacheKey = `${isProduction ? 'live' : 'sandbox'}:${clientId}`;
  if (paypalTokenCache.token && paypalTokenCache.key === cacheKey && Date.now() < paypalTokenCache.expiresAt) {
    return { baseUrl, token: paypalTokenCache.token };
  }
  // Kredensial salah mode (cth. kredensial Production dipakai di Sandbox) adalah penyebab
  // umum `invalid_client`. Jangan cache hasil gagal agar retry setelah koreksi langsung dicoba.
  const credentials = Buffer.from(`${clientId}:${secret}`).toString('base64');
  let response;
  try {
    response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(30000),
    });
  } catch (networkError) {
    console.error('PayPal token fetch error:', networkError.name, networkError.message);
    const paymentError = new Error('Tidak dapat menghubungi PayPal. Periksa koneksi internet server.');
    paymentError.isPaymentError = true;
    throw paymentError;
  }
  const result = await response.json().catch(() => null);
  if (!response.ok || !result || !result.access_token) {
    // Log diagnostik tanpa membocorkan secret: prefix + panjang cukup untuk deteksi
    // salah-copy / salah-mode (sandbox vs production). Lihat di Admin > Log.
    console.error('PayPal token error:', JSON.stringify({
      httpStatus: response.status,
      error: result && (result.error || result.name),
      description: result && (result.error_description || result.message),
      env: isProduction ? 'production' : 'sandbox',
      baseUrl,
      clientIdPrefix: String(clientId).slice(0, 8),
      clientIdLen: String(clientId).length,
      secretLen: String(secret).length,
    }));
    paypalTokenCache = { key: '', token: '', expiresAt: 0 };
    let hint = 'Gagal otentikasi ke PayPal. Periksa Client ID & Secret.';
    if (response.status === 401 || (result && result.error === 'invalid_client')) {
      hint += ` Pastikan pasangan dari mode ${isProduction ? 'Production (Live)' : 'Sandbox'} di developer.paypal.com dipakai bersama mode yang sama di admin (jangan campur Sandbox <-> Production), tanpa spasi tambahan.`;
    }
    const paymentError = new Error(hint);
    paymentError.isPaymentError = true;
    throw paymentError;
  }
  paypalTokenCache = {
    key: cacheKey,
    token: result.access_token,
    expiresAt: Date.now() + (Math.max(Number(result.expires_in) || 3600, 60) - 60) * 1000,
  };
  return { baseUrl, token: paypalTokenCache.token };
}

// Buat order PayPal -> { paypalOrderId, approvalUrl, amountUsd }
async function createPaypalOrder({ referenceId, amountIdr, fallbackOrigin }) {
  const { siteUrl, rate, currency } = await getPaypalConfig();
  const { baseUrl, token } = await getPaypalAccessToken();
  const appUrl = siteUrl || fallbackOrigin || '';
  if (!appUrl) {
    const paymentError = new Error('URL Website Toko belum diatur. Isi di Admin > Payment Gateway.');
    paymentError.isPaymentError = true;
    throw paymentError;
  }
  const amountUsd = idrToUsd(amountIdr, rate).toFixed(2);
  let response;
  try {
    response = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': referenceId,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: referenceId,
            amount: { currency_code: currency, value: amountUsd },
          },
        ],
        application_context: {
          return_url: `${appUrl}/order/${referenceId}?paypal=return`,
          cancel_url: `${appUrl}/order/${referenceId}?payment=cancelled`,
          brand_name: 'Eliteikon',
          user_action: 'PAY_NOW',
        },
      }),
      signal: AbortSignal.timeout(60000),
    });
  } catch (networkError) {
    console.error('PayPal create order fetch error:', networkError.name, networkError.message);
    const paymentError = new Error('Tidak dapat menghubungi PayPal. Periksa koneksi internet server.');
    paymentError.isPaymentError = true;
    throw paymentError;
  }
  const result = await response.json().catch(() => null);
  const approvalUrl = result && Array.isArray(result.links)
    ? String((result.links.find((l) => l.rel === 'approve') || {}).href || '')
    : '';
  console.log(
    'PayPal create order response:',
    JSON.stringify({ httpStatus: response.status, paypalOrderId: result && result.id, amountUsd, currency, referenceId })
  );
  if (!response.ok || !result || !result.id || !approvalUrl) {
    const detail = result && result.details && result.details[0];
    const paymentError = new Error(
      `PayPal: ${(detail && (detail.description || detail.issue)) || (result && result.message) || 'gagal membuat sesi pembayaran'}`
    );
    paymentError.isPaymentError = true;
    throw paymentError;
  }
  return { paypalOrderId: String(result.id), approvalUrl, amountUsd };
}

// Ambil status order PayPal langsung dari API (sumber kebenaran untuk capture & webhook)
async function getPaypalOrderStatus(paypalOrderId) {
  const { baseUrl, token } = await getPaypalAccessToken();
  const response = await fetch(`${baseUrl}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(30000),
  });
  return response.json().catch(() => null);
}

// Tandai order lunas bila capture PayPal COMPLETED dan nominal cocok (idempotent)
async function settlePaypalOrderByCapture({ referenceId, paypalOrderId, capturedUsd, payerEmail }) {
  const { rate, currency } = await getPaypalConfig();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [orders] = await connection.query('SELECT * FROM orders WHERE reference_id = ? FOR UPDATE', [referenceId]);
    if (orders.length === 0) {
      await connection.rollback();
      return { ok: false, reason: 'not-found' };
    }
    const order = orders[0];
    if (order.status === 'paid') {
      await connection.rollback();
      return { ok: true, reason: 'already-paid' };
    }
    if (order.payment_provider !== 'paypal') {
      await connection.rollback();
      return { ok: false, reason: 'wrong-provider' };
    }
    const expectedUsd = idrToUsd(order.total, rate);
    if (Number(capturedUsd) + 0.05 < expectedUsd) {
      await connection.rollback();
      console.error(
        'PayPal capture: nominal tidak cocok:',
        JSON.stringify({ referenceId, capturedUsd, expectedUsd, currency })
      );
      return { ok: false, reason: 'amount-mismatch' };
    }
    await connection.query(
      "UPDATE orders SET status = 'paid', paid_at = COALESCE(paid_at, NOW()), payment_session_id = ?, payment_channel = ? WHERE id = ?",
      [paypalOrderId || order.payment_session_id, payerEmail ? `PayPal ${payerEmail}` : 'PayPal', order.id]
    );
    await applyOrderStockReduction(connection, order.id);
    await connection.commit();
    return { ok: true, reason: 'paid' };
  } catch (innerError) {
    await connection.rollback();
    throw innerError;
  } finally {
    connection.release();
  }
}

// Origin request saat ini — fallback jika `site_url` belum diatur di Setting admin
function getRequestOrigin(req) {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const forwardedHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
  const proto = forwardedProto || req.protocol || 'http';
  const host = forwardedHost || String(req.get('host') || '').trim();
  return host ? `${proto}://${host}` : '';
}

// Sesi pembayaran Tripay (closed payment):
// signature = HMAC-SHA256(merchantCode + merchantRef + amount, privateKey)
async function createTripayPaymentSession({ referenceId, items, buyer, fallbackOrigin }) {
  const { baseUrl, merchantCode, apiKey, privateKey, channel, expiredMinutes, siteUrl, callbackUrl, isProduction } =
    await getTripayConfig();

  // URL toko untuk return/callback: dari Setting admin, fallback ke origin request
  const appUrl = siteUrl || fallbackOrigin || '';
  if (!appUrl) {
    const paymentError = new Error('URL Website Toko belum diatur. Isi di Admin > Payment Gateway.');
    paymentError.isPaymentError = true;
    throw paymentError;
  }

  const amount = items.reduce((sum, item) => sum + Math.round(Number(item.price)) * item.quantity, 0);
  const signature = crypto
    .createHmac('sha256', privateKey)
    .update(`${merchantCode}${referenceId}${amount}`)
    .digest('hex');

  const body = {
    method: channel,
    merchant_ref: referenceId,
    amount,
    customer_name: buyer.name,
    customer_email: buyer.email || '',
    customer_phone: buyer.phone,
    order_items: items.map((item) => ({
      sku: item.sku || `VAR-${item.variant_id}`,
      name: item.product_name,
      price: Math.round(Number(item.price)),
      quantity: item.quantity,
      product_url: `${appUrl}/product/${item.product_id}`,
    })),
    callback_url: callbackUrl || `${appUrl}/api/tripay/callback`,
    return_url: `${appUrl}/order/${referenceId}`,
    expired_time: Math.floor(Date.now() / 1000) + expiredMinutes * 60,
    signature,
  };

  let response;
  try {
    response = await fetch(`${baseUrl}/transaction/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });
  } catch (networkError) {
    console.error('Tripay fetch error:', networkError.name, networkError.message);
    const paymentError = new Error('Tidak dapat menghubungi Tripay. Periksa koneksi internet server.');
    paymentError.isPaymentError = true;
    throw paymentError;
  }

  const result = await response.json().catch(() => null);
  // Log ringkas untuk diagnosis dari tab Log admin (tanpa apiKey/privateKey)
  console.log(
    'Tripay payment response:',
    JSON.stringify({
      httpStatus: response.status,
      success: result ? result.success : null,
      message: result ? result.message : null,
      baseUrl,
      env: isProduction ? 'production' : 'sandbox',
      channel,
      referenceId,
    })
  );

  const data = result && result.data;
  if (!result || !result.success || !data || !data.reference) {
    const paymentError = new Error(
      result && result.message ? `Tripay: ${result.message}` : 'Gagal membuat sesi pembayaran di Tripay'
    );
    paymentError.isPaymentError = true;
    throw paymentError;
  }

  return {
    sessionId: String(data.reference),
    paymentUrl: data.checkout_url || data.pay_url || '',
  };
}

// Reference ID unik pesanan, contoh: ELK-20261017-A1B2C3
function secureRandomIndex(max) {
  try {
    const nc = require('crypto');
    if (nc && typeof nc.randomInt === 'function') return nc.randomInt(0, max);
    if (nc && typeof nc.randomBytes === 'function') return nc.randomBytes(4).readUInt32BE(0) % max;
  } catch (_) { /* abaikan, lanjut ke fallback */ }
  const g = typeof globalThis !== 'undefined' ? globalThis.crypto : null;
  if (g && typeof g.getRandomValues === 'function') {
    const arr = new Uint32Array(1);
    g.getRandomValues(arr);
    return arr[0] % max;
  }
  return Math.floor(Math.random() * max);
}

async function generateOrderReference(connection) {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 5; attempt += 1) {
    let suffix = '';
    for (let i = 0; i < 6; i += 1) {
      suffix += alphabet[secureRandomIndex(alphabet.length)];
    }
    const referenceId = `ELK-${datePart}-${suffix}`;
    const [existing] = await connection.query('SELECT id FROM orders WHERE reference_id = ?', [referenceId]);
    if (existing.length === 0) return referenceId;
  }
  return `ELK-${datePart}-${Date.now().toString(36).toUpperCase()}`;
}

// Kurangi stok varian sekali saja saat order menjadi paid (idempotent)
async function applyOrderStockReduction(connection, orderId) {
  const [orders] = await connection.query('SELECT id, stock_reduced FROM orders WHERE id = ? FOR UPDATE', [orderId]);
  if (orders.length === 0 || orders[0].stock_reduced) return false;

  const [items] = await connection.query('SELECT variant_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
  for (const item of items) {
    if (item.variant_id) {
      await connection.query('UPDATE product_variants SET stock = GREATEST(stock - ?, 0) WHERE id = ?', [
        item.quantity,
        item.variant_id,
      ]);
    }
  }
  await connection.query('UPDATE orders SET stock_reduced = 1 WHERE id = ?', [orderId]);
  return true;
}

const ORDER_STATUSES = ['pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled', 'expired'];


// --- ORDERS ROUTES ---

// POST /api/orders (Public) - buat pesanan + sesi pembayaran (Tripay atau PayPal sesuai pilihan pelanggan)
app.post('/api/orders', orderLimiter, async (req, res) => {
  const requestedMethod = String((req.body && req.body.payment_method) || '').trim().toLowerCase();
  if (requestedMethod !== 'tripay' && requestedMethod !== 'paypal') {
    return res.status(400).json({ success: false, message: 'Metode pembayaran tidak valid. Pilih Tripay atau PayPal.' });
  }
  const activeGateway = requestedMethod;

  if (activeGateway === 'paypal') {
    if (!(await isGatewayEnabled('paypal'))) {
      return res.status(503).json({ success: false, message: 'Pembayaran PayPal sedang nonaktif.' });
    }
    if (!(await isPaypalConfigured())) {
      return res.status(503).json({
        success: false,
        message: 'Payment gateway PayPal belum dikonfigurasi. Lengkapi di Admin > Payment Gateway.',
      });
    }
  } else {
    if (!(await isGatewayEnabled('tripay'))) {
      return res.status(503).json({ success: false, message: 'Pembayaran Tripay sedang nonaktif.' });
    }
    if (!(await isTripayConfigured())) {
      return res.status(503).json({
        success: false,
        message: 'Payment gateway Tripay belum dikonfigurasi. Lengkapi di Admin > Payment Gateway.',
      });
    }
  }

  const { buyer_name, buyer_phone, buyer_email, address, city, notes, items } = req.body || {};

  const cleanName = String(buyer_name || '').trim();
  const cleanPhone = String(buyer_phone || '').trim();
  const cleanEmail = String(buyer_email || '').trim();
  const cleanAddress = String(address || '').trim();
  const cleanCity = String(city || '').trim();
  const cleanNotes = String(notes || '').trim();

  // Email wajib diisi: dibutuhkan gateway pembayaran (Tripay menolak customer_email kosong)
  if (!cleanName || !cleanPhone || !cleanEmail || !cleanAddress || !cleanCity) {
    return res.status(400).json({ success: false, message: 'Nama, telepon, email, alamat, dan kota wajib diisi' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ success: false, message: 'Format email tidak valid' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Keranjang tidak boleh kosong' });
  }

  const normalizedItems = [];
  for (const item of items) {
    const variantId = parseInt(item.variant_id, 10);
    const quantity = parseInt(item.quantity, 10);
    if (!variantId || !quantity || quantity < 1 || quantity > 99) {
      return res.status(400).json({ success: false, message: 'Data item pesanan tidak valid' });
    }
    normalizedItems.push({ variantId, quantity });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const variantIds = normalizedItems.map((i) => i.variantId);
    const [variants] = await connection.query(
      `SELECT v.*, p.name AS product_name, p.base_price, p.status AS product_status, p.is_preorder
       FROM product_variants v
       JOIN products p ON v.product_id = p.id
       WHERE v.id IN (?)
       FOR UPDATE`,
      [variantIds]
    );

    const orderItems = [];
    let subtotal = 0;

    for (const item of normalizedItems) {
      const variant = variants.find((v) => v.id === item.variantId);
      if (!variant) {
        throw new Error(`Varian dengan ID ${item.variantId} tidak ditemukan`);
      }
      if (variant.product_status !== 'active') {
        throw new Error(`Produk "${variant.product_name}" sedang tidak tersedia`);
      }
      if (!variant.is_preorder && variant.stock < item.quantity) {
        throw new Error(
          `Stok "${variant.product_name}" (${variant.size}/${variant.color}) tidak mencukupi. Tersedia ${variant.stock} item.`
        );
      }

      const price =
        variant.price_override !== null && variant.price_override !== undefined
          ? Number(variant.price_override)
          : Number(variant.base_price);
      const lineSubtotal = price * item.quantity;
      subtotal += lineSubtotal;

      orderItems.push({
        product_id: variant.product_id,
        variant_id: variant.id,
        product_name: variant.product_name,
        variant_size: variant.size,
        variant_color: variant.color,
        sku: variant.sku,
        price,
        quantity: item.quantity,
        subtotal: lineSubtotal,
      });
    }

    const referenceId = await generateOrderReference(connection);

    const [orderResult] = await connection.query(
      `INSERT INTO orders
        (reference_id, buyer_name, buyer_phone, buyer_email, address, city, notes, subtotal, total, status, payment_provider)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [referenceId, cleanName, cleanPhone, cleanEmail || null, cleanAddress, cleanCity, cleanNotes || null, subtotal, subtotal, activeGateway]
    );
    const orderId = orderResult.insertId;

    for (const item of orderItems) {
      await connection.query(
        `INSERT INTO order_items
          (order_id, product_id, variant_id, product_name, variant_size, variant_color, sku, price, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.product_id,
          item.variant_id,
          item.product_name,
          item.variant_size,
          item.variant_color,
          item.sku,
          item.price,
          item.quantity,
          item.subtotal,
        ]
      );
    }

    // Buat sesi pembayaran sesuai gateway pilihan; kalau gagal, seluruh transaksi di-rollback
    let payment;
    if (activeGateway === 'paypal') {
      const { paypalOrderId, approvalUrl } = await createPaypalOrder({
        referenceId,
        amountIdr: subtotal,
        fallbackOrigin: getRequestOrigin(req),
      });
      payment = { sessionId: paypalOrderId, paymentUrl: approvalUrl };
    } else {
      const paymentPayload = {
        referenceId,
        items: orderItems,
        buyer: { name: cleanName, phone: cleanPhone, email: cleanEmail },
        fallbackOrigin: getRequestOrigin(req),
      };
      payment = await createTripayPaymentSession(paymentPayload);
    }

    await connection.query('UPDATE orders SET payment_session_id = ?, payment_url = ? WHERE id = ?', [
      payment.sessionId,
      payment.paymentUrl,
      orderId,
    ]);

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat. Silakan lanjutkan pembayaran.',
      data: {
        id: orderId,
        reference_id: referenceId,
        payment_provider: activeGateway,
        total: subtotal,
        payment_url: payment.paymentUrl,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create order error:', error.message);
    if (error.isPaymentError) {
      return res.status(502).json({ success: false, message: `Gagal membuat sesi pembayaran: ${error.message}` });
    }
    // Jangan teruskan pesan error mentah (bisa berisi detail DB/internal) ke publik
    const isOperational = !error.code && error.name === 'Error';
    res.status(400).json({
      success: false,
      message: isOperational && error.message ? error.message : 'Gagal membuat pesanan. Silakan coba lagi.',
    });
  } finally {
    connection.release();
  }
});

// POST /api/tripay/callback (Public) - webhook notifikasi pembayaran dari Tripay
// Keamanan: header X-Callback-Signature = HMAC-SHA256(body mentah, private key) wajib valid.
app.post('/api/tripay/callback', callbackLimiter, async (req, res) => {
  const { privateKey } = await getTripayConfig();

  try {
    if (!privateKey) {
      console.error('Tripay callback: private key belum dikonfigurasi, signature tidak dapat divalidasi');
      return res.status(400).json({ success: false });
    }

    const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body || {});
    const expectedSignature = crypto.createHmac('sha256', privateKey).update(rawBody).digest('hex');
    const receivedSignature = String(req.headers['x-callback-signature'] || '').toLowerCase();

    const signatureValid =
      receivedSignature.length === expectedSignature.length &&
      crypto.timingSafeEqual(Buffer.from(receivedSignature), Buffer.from(expectedSignature));

    if (!signatureValid) {
      console.warn('Tripay callback: signature tidak valid');
      return res.status(401).json({ success: false });
    }

    // Hanya memproses event perubahan status pembayaran
    const event = String(req.headers['x-callback-event'] || '');
    if (event && event !== 'payment_status') {
      return res.status(200).json({ success: true });
    }

    const data = (req.body && req.body.data) || req.body || {};
    const referenceId = data.merchant_ref;
    if (!referenceId) {
      return res.status(200).json({ success: true, message: 'Callback tanpa merchant_ref diabaikan' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [orders] = await connection.query('SELECT * FROM orders WHERE reference_id = ? FOR UPDATE', [referenceId]);
      if (orders.length === 0) {
        await connection.rollback();
        return res.status(200).json({ success: true, message: 'Pesanan tidak ditemukan, diabaikan' });
      }

      const order = orders[0];
      const status = String(data.status || '').toUpperCase();

      if (status === 'PAID') {
        // Idempotent: jangan proses ulang kalau sudah paid.
        // Kolom ipaymu_trx_id menyimpan reference Tripay (nama kolom historis, dipertahankan agar data lama tetap terbaca).
        if (order.status !== 'paid') {
          await connection.query(
            "UPDATE orders SET status = 'paid', paid_at = NOW(), ipaymu_trx_id = ?, payment_channel = ? WHERE id = ?",
            [
              data.reference !== undefined && data.reference !== null ? String(data.reference) : null,
              data.payment_method_code !== undefined && data.payment_method_code !== null
                ? String(data.payment_method_code)
                : null,
              order.id,
            ]
          );
          await applyOrderStockReduction(connection, order.id);
        }
      } else if (status === 'EXPIRED') {
        if (order.status === 'pending') {
          await connection.query("UPDATE orders SET status = 'expired' WHERE id = ?", [order.id]);
        }
      } else if (status === 'FAILED') {
        if (order.status === 'pending') {
          await connection.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [order.id]);
        }
      }
      // REFUND: tidak mengubah status otomatis, ditangani manual oleh admin

      await connection.commit();
      res.status(200).json({ success: true });
    } catch (innerError) {
      await connection.rollback();
      throw innerError;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Tripay callback error:', error);
    res.status(500).json({ success: false, message: 'Gagal memproses callback' });
  }
});

// POST /api/paypal/test-connection (Admin) - verifikasi Client ID & Secret tanpa membuat order.
// Mengembalikan env/baseUrl yang dipakai agar salah-mode (sandbox vs production) langsung terlihat.
app.post('/api/paypal/test-connection', verifyToken, async (req, res) => {
  try {
    const cfg = await getPaypalConfig();
    await getPaypalAccessToken();
    res.json({
      success: true,
      message: `Koneksi PayPal ${cfg.isProduction ? 'Production' : 'Sandbox'} berhasil.`,
      data: { env: cfg.isProduction ? 'production' : 'sandbox', baseUrl: cfg.baseUrl },
    });
  } catch (error) {
    res.status(502).json({ success: false, message: error.isPaymentError ? error.message : 'Gagal menguji koneksi PayPal.' });
  }
});

// POST /api/paypal/capture (Public) - dipanggil halaman status pesanan setelah
// pembeli kembali dari PayPal (?paypal=return). Capture diotorisasi di sisi server,
// kebenaran diambil dari API PayPal (bukan dari parameter browser).
app.post('/api/paypal/capture', orderLimiter, async (req, res) => {
  const referenceId = String((req.body && req.body.reference_id) || '').trim();
  if (!referenceId) {
    return res.status(400).json({ success: false, message: 'Kode referensi pesanan wajib diisi' });
  }
  try {
    const [orders] = await pool.query('SELECT * FROM orders WHERE reference_id = ?', [referenceId]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }
    const order = orders[0];
    if (order.status === 'paid') {
      return res.json({ success: true, message: 'Pesanan sudah dibayar' });
    }
    if (order.payment_provider !== 'paypal' || !order.payment_session_id) {
      return res.status(400).json({ success: false, message: 'Pesanan ini bukan pembayaran PayPal' });
    }
    const paypalOrderId = String(order.payment_session_id);
    const status = await getPaypalOrderStatus(paypalOrderId);
    if (!status) {
      return res.status(502).json({ success: false, message: 'Tidak dapat memeriksa status ke PayPal' });
    }
    if (status.status === 'APPROVED') {
      // Pembeli sudah menyetujui di PayPal tapi dana belum ditangkap -> capture sekarang
      const { baseUrl, token } = await getPaypalAccessToken();
      const captureRes = await fetch(`${baseUrl}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(60000),
      });
      const captureResult = await captureRes.json().catch(() => null);
      console.log(
        'PayPal capture response:',
        JSON.stringify({ httpStatus: captureRes.status, paypalOrderId, status: captureResult && captureResult.status, referenceId })
      );
      if (!captureRes.ok || !captureResult || captureResult.status !== 'COMPLETED') {
        return res.status(502).json({ success: false, message: 'Capture PayPal gagal. Coba lagi atau hubungi kami.' });
      }
      const unit = (captureResult.purchase_units || [])[0] || {};
      const payment = unit.payments || {};
      const capture = (payment.captures || [])[0] || {};
      const capturedUsd = Number((capture.amount || {}).value || 0);
      const payerEmail = captureResult.payer && captureResult.payer.email_address;
      const settled = await settlePaypalOrderByCapture({ referenceId, paypalOrderId, capturedUsd, payerEmail });
      if (!settled.ok) {
        return res.status(502).json({ success: false, message: 'Verifikasi nominal PayPal gagal. Hubungi kami.' });
      }
      return res.json({ success: true, message: 'Pembayaran PayPal berhasil' });
    }
    if (status.status === 'COMPLETED') {
      // Sudah tercapture sebelumnya (mis. via webhook) -> sinkronkan status lokal
      const unit = (status.purchase_units || [])[0] || {};
      const payment = unit.payments || {};
      const capture = (payment.captures || [])[0] || {};
      const capturedUsd = Number((capture.amount || {}).value || 0);
      const payerEmail = status.payer && status.payer.email_address;
      await settlePaypalOrderByCapture({ referenceId, paypalOrderId, capturedUsd, payerEmail });
      return res.json({ success: true, message: 'Pembayaran PayPal berhasil' });
    }
    return res.status(400).json({ success: false, message: 'Pembayaran PayPal belum disetujui. Selesaikan di halaman PayPal.' });
  } catch (error) {
    console.error('PayPal capture error:', error.message);
    if (error.isPaymentError) {
      return res.status(502).json({ success: false, message: `Gagal memverifikasi PayPal: ${error.message}` });
    }
    res.status(500).json({ success: false, message: 'Gagal memproses capture PayPal' });
  }
});

// POST /api/paypal/webhook (Public) - notifikasi server-to-server dari PayPal.
// Keamanan berlapis: bila `paypal_webhook_id` diisi, signature diverifikasi ke API PayPal;
// bila kosong, event tetap dibuktikan dengan membaca order/capture langsung dari API PayPal.
app.post('/api/paypal/webhook', callbackLimiter, async (req, res) => {
  try {
    const { webhookId } = await getPaypalConfig();
    const event = req.body || {};
    const eventType = String(event.event_type || '');

    if (webhookId) {
      try {
        const { baseUrl, token } = await getPaypalAccessToken();
        const verifyRes = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            auth_algo: req.headers['paypal-auth-algo'],
            cert_url: req.headers['paypal-cert-url'],
            transmission_id: req.headers['paypal-transmission-id'],
            transmission_sig: req.headers['paypal-transmission-sig'],
            transmission_time: req.headers['paypal-transmission-time'],
            webhook_id: webhookId,
            webhook_event: event,
          }),
          signal: AbortSignal.timeout(30000),
        });
        const verifyResult = await verifyRes.json().catch(() => null);
        if (!verifyRes.ok || !verifyResult || verifyResult.verification_status !== 'SUCCESS') {
          console.warn('PayPal webhook: signature tidak valid');
          return res.status(401).json({ success: false });
        }
      } catch (verifyError) {
        console.error('PayPal webhook verify error:', verifyError.message);
        return res.status(502).json({ success: false });
      }
    }

    if (eventType === 'CHECKOUT.ORDER.APPROVED') {
      // Tangkap dana otomatis supaya lunas walau pembeli menutup browser
      const paypalOrderId = String((event.resource || {}).id || '');
      if (paypalOrderId) {
        try {
          const { baseUrl, token } = await getPaypalAccessToken();
          await fetch(`${baseUrl}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(60000),
          });
        } catch (captureError) {
          console.error('PayPal webhook auto-capture error:', captureError.message);
        }
      }
      return res.status(200).json({ success: true });
    }

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      const resource = event.resource || {};
      const paypalOrderId = String(
        (resource.supplementary_data && resource.supplementary_data.related_ids &&
          resource.supplementary_data.related_ids.order_id) || ''
      );
      const capturedUsd = Number((resource.amount || {}).value || 0);
      if (paypalOrderId) {
        const status = await getPaypalOrderStatus(paypalOrderId);
        const refFromApi = status && status.purchase_units && status.purchase_units[0]
          ? String(status.purchase_units[0].reference_id || '')
          : '';
        if (refFromApi) {
          await settlePaypalOrderByCapture({ referenceId: refFromApi, paypalOrderId, capturedUsd });
        }
      }
      return res.status(200).json({ success: true });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('PayPal webhook error:', error.message);
    res.status(500).json({ success: false, message: 'Gagal memproses webhook PayPal' });
  }
});

// GET /api/orders/reference/:referenceId (Public) - status pesanan untuk halaman pembeli
app.get('/api/orders/reference/:referenceId', async (req, res) => {
  const { referenceId } = req.params;
  try {
    const [orders] = await pool.query(
      `SELECT id, reference_id, buyer_name, city, subtotal, total, status, payment_provider, payment_url, paid_at, created_at
       FROM orders WHERE reference_id = ?`,
      [referenceId]
    );
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    const order = orders[0];
    const [items] = await pool.query(
      'SELECT product_name, variant_size, variant_color, sku, price, quantity, subtotal FROM order_items WHERE order_id = ?',
      [order.id]
    );

    res.json({
      success: true,
      data: {
        reference_id: order.reference_id,
        buyer_name: order.buyer_name,
        city: order.city,
        subtotal: order.subtotal,
        total: order.total,
        status: order.status,
        payment_provider: order.payment_provider,
        paid_at: order.paid_at,
        created_at: order.created_at,
        // Link pembayaran hanya relevan selama pesanan belum dibayar
        payment_url: order.status === 'pending' ? order.payment_url : null,
        items,
      },
    });
  } catch (error) {
    console.error('Get order by reference error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data pesanan' });
  }
});

// GET /api/orders (Admin) - daftar pesanan + pagination, search, filter, sort
app.get('/api/orders', verifyToken, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const offset = (page - 1) * limit;
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || '').trim();
    const sort = req.query.sort || 'newest';

    const whereClauses = [];
    const queryParams = [];
    const countParams = [];

    if (search) {
      whereClauses.push('(o.reference_id LIKE ? OR o.buyer_name LIKE ? OR o.buyer_phone LIKE ?)');
      const wild = `%${search}%`;
      queryParams.push(wild, wild, wild);
      countParams.push(wild, wild, wild);
    }
    if (status) {
      whereClauses.push('o.status = ?');
      queryParams.push(status);
      countParams.push(status);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM orders o ${whereSql}`, countParams);
    const totalPages = Math.ceil(total / limit);

    let orderSql = 'ORDER BY o.id DESC';
    if (sort === 'oldest') orderSql = 'ORDER BY o.id ASC';
    else if (sort === 'total_desc') orderSql = 'ORDER BY o.total DESC';
    else if (sort === 'total_asc') orderSql = 'ORDER BY o.total ASC';

    queryParams.push(limit, offset);

    const [orders] = await pool.query(
      `SELECT o.id, o.reference_id, o.buyer_name, o.buyer_phone, o.buyer_email, o.city, o.subtotal, o.total,
              o.status, o.payment_channel, o.paid_at, o.created_at,
              (SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
       FROM orders o
       ${whereSql}
       ${orderSql}
       LIMIT ? OFFSET ?`,
      queryParams
    );

    res.json({
      success: true,
      data: orders,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar pesanan' });
  }
});

// GET /api/orders/:id (Admin) - detail pesanan + item
app.get('/api/orders/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
    res.json({ success: true, data: { ...orders[0], items } });
  } catch (error) {
    console.error('Get order detail error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail pesanan' });
  }
});

// PUT /api/orders/:id/status (Admin) - update status pesanan
app.put('/api/orders/:id/status', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};

  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: `Status tidak valid. Pilihan: ${ORDER_STATUSES.join(', ')}` });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [orders] = await connection.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [id]);
    if (orders.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }
    const order = orders[0];

    if (status === 'paid') {
      await connection.query("UPDATE orders SET status = 'paid', paid_at = COALESCE(paid_at, NOW()) WHERE id = ?", [order.id]);
      await applyOrderStockReduction(connection, order.id);
    } else {
      await connection.query('UPDATE orders SET status = ? WHERE id = ?', [status, order.id]);
    }

    await connection.commit();
    res.json({ success: true, message: 'Status pesanan berhasil diperbarui' });
  } catch (error) {
    await connection.rollback();
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui status pesanan' });
  } finally {
    connection.release();
  }
});


// Error handler terakhir: semua error tak tertangani (termasuk MulterError dan
// penolakan CORS) dibalas JSON generik, bukan HTML/stack trace
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.message ? err.message : err);
  if (err && (err.type === 'entity.parse.failed' || err.status === 400)) {
    return res.status(400).json({ success: false, message: 'Format data tidak valid' });
  }
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'Ukuran file maksimal 5MB' });
    }
    return res.status(400).json({ success: false, message: 'Upload gagal. Periksa file Anda.' });
  }
  if (err && err.message === 'Only images are allowed!') {
    return res.status(400).json({ success: false, message: 'Hanya file gambar yang diizinkan' });
  }
  if (err && err.message === 'Origin tidak diizinkan oleh CORS') {
    return res.status(403).json({ success: false, message: 'Akses ditolak' });
  }
  res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem' });
});


// Start server
app.listen(PORT, () => {
  console.log(`elkon backend server is running on port ${PORT}`);
});
