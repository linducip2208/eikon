const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
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

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Nama, email, dan password wajib diisi' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'admin']
    );

    res.status(201).json({
      success: true,
      message: 'Admin berhasil didaftarkan',
      data: { id: result.insertId, name, email },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
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


// --- FILE UPLOAD ROUTE ---
app.post('/api/upload', verifyToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Tidak ada gambar yang diunggah' });
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
app.post('/api/contacts', async (req, res) => {
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


// --- SETTINGS ROUTES ---

// GET /api/settings (Public - returns object maps)
app.get('/api/settings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT key_name, value_text FROM settings');
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

// PUT /api/settings (Admin)
app.put('/api/settings', verifyToken, async (req, res) => {
  const settingsObj = req.body; // e.g. { whatsapp_number: '62...' }
  if (!settingsObj || Object.keys(settingsObj).length === 0) {
    return res.status(400).json({ success: false, message: 'Data pengaturan tidak boleh kosong' });
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    for (const [key, val] of Object.entries(settingsObj)) {
      const valueText = typeof val === "string" ? val.trim() : String(val);
      await connection.query(
        'INSERT INTO settings (key_name, value_text) VALUES (?, ?) ON DUPLICATE KEY UPDATE value_text = ?',
        [key, valueText, valueText]
      );
    }
    await connection.commit();
    connection.release();
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

// --- IPAYMU PAYMENT GATEWAY (konfigurasi & helper) ---
// Semua kredensial dibaca dari .env (backend/.env), TIDAK di-hardcode.

function getIpaymuConfig() {
  const isProduction = (process.env.IPAYMU_ENV || 'sandbox').toLowerCase() === 'production';
  const defaultBaseUrl = isProduction ? 'https://my.ipaymu.com/api/v2' : 'https://sandbox.ipaymu.com/api/v2';
  return {
    baseUrl: (process.env.IPAYMU_BASE_URL || defaultBaseUrl).replace(/\/+$/, ''),
    va: (process.env.IPAYMU_VA || '').trim(),
    apiKey: (process.env.IPAYMU_API_KEY || '').trim(),
    appUrl: (process.env.APP_URL || 'http://localhost:5173').replace(/\/+$/, ''),
    notifyUrl: (process.env.IPAYMU_NOTIFY_URL || '').trim(),
  };
}

function isIpaymuConfigured() {
  const { va, apiKey } = getIpaymuConfig();
  return Boolean(va && apiKey);
}

// Timestamp request iPaymu: YYYYMMDDHHmmss (waktu lokal server)
function formatIpaymuTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

// Signature request iPaymu v2:
//   String to Sign = Method + ":" + VA + ":" + SHA256(bodyJson) + ":" + ApiKey
//   Signature      = HMAC-SHA256(String to Sign, ApiKey)
function buildIpaymuRequestSignature(method, va, apiKey, bodyJson) {
  const bodyHash = crypto.createHash('sha256').update(bodyJson).digest('hex');
  const stringToSign = `${method}:${va}:${bodyHash}:${apiKey}`;
  return crypto.createHmac('sha256', apiKey).update(stringToSign).digest('hex');
}

// Normalisasi payload callback sesuai dokumentasi resmi iPaymu sebelum validasi signature
function normalizeIpaymuCallbackData(rawData) {
  const result = {};
  for (const key of Object.keys(rawData)) {
    const val = rawData[key];
    if (key === 'signature') continue; // field signature tidak ikut dihitung
    if (key === 'is_escrow') {
      result[key] = val === 'true' || val === '1' || val === 1 || val === true;
    } else if (['trx_id', 'status_code', 'transaction_status_code', 'paid_off'].includes(key)) {
      const parsed = parseInt(val, 10);
      result[key] = Number.isNaN(parsed) ? 0 : parsed;
    } else if (key === 'additional_info') {
      result[key] = val === '[]' ? [] : val;
    } else {
      result[key] = String(val);
    }
  }
  if (!Object.prototype.hasOwnProperty.call(result, 'additional_info')) {
    result['additional_info'] = [];
  }
  return result;
}

// Urutkan key A-Z (meniru ksort milik PHP)
function sortObjectKeysAlphabetically(obj) {
  return Object.keys(obj)
    .sort((a, b) => a.localeCompare(b))
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
}

// Validasi header X-Signature callback: HMAC-SHA256(json ternormalisasi, secret = Nomor VA)
function isValidIpaymuCallbackSignature(rawData, receivedSignature, va) {
  if (!receivedSignature) return false;
  const sorted = sortObjectKeysAlphabetically(normalizeIpaymuCallbackData(rawData));
  let jsonBody = JSON.stringify(sorted);
  jsonBody = jsonBody.replace(/\//g, '\\/');
  const expected = crypto.createHmac('sha256', va).update(jsonBody).digest('hex');
  const expectedBuf = Buffer.from(expected, 'utf8');
  const receivedBuf = Buffer.from(String(receivedSignature), 'utf8');
  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

// Buat sesi pembayaran Redirect di iPaymu -> { sessionId, paymentUrl }
async function createIpaymuPaymentSession({ referenceId, items, buyer }) {
  const { baseUrl, va, apiKey, appUrl, notifyUrl } = getIpaymuConfig();

  const body = {
    product: items.map((item) => item.product_name),
    qty: items.map((item) => String(item.quantity)),
    price: items.map((item) => String(Math.round(Number(item.price)))),
    description: items.map((item) => `${item.variant_size || '-'} / ${item.variant_color || '-'}${item.sku ? ` (${item.sku})` : ''}`),
    returnUrl: `${appUrl}/order/${referenceId}`,
    notifyUrl: notifyUrl || `${appUrl}/api/ipaymu/callback`,
    cancelUrl: `${appUrl}/order/${referenceId}?payment=cancelled`,
    referenceId,
    buyerName: buyer.name,
    buyerEmail: buyer.email || '',
    buyerPhone: buyer.phone,
    expired: 24, // jam
  };

  const bodyJson = JSON.stringify(body);
  const signature = buildIpaymuRequestSignature('POST', va, apiKey, bodyJson);

  let response;
  try {
    response = await fetch(`${baseUrl}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        va,
        signature,
        timestamp: formatIpaymuTimestamp(),
      },
      body: bodyJson,
      signal: AbortSignal.timeout(60000),
    });
  } catch (networkError) {
    console.error(
      'iPaymu fetch error:',
      networkError.name,
      networkError.message,
      networkError.cause ? `| cause: ${networkError.cause.message}` : ''
    );
    const paymentError = new Error('Tidak dapat menghubungi iPaymu. Periksa koneksi internet server.');
    paymentError.isPaymentError = true;
    throw paymentError;
  }

  const result = await response.json().catch(() => null);
  if (!result || Number(result.Status) !== 200 || !result.Data || !result.Data.Url) {
    const paymentError = new Error(
      result && result.Message ? result.Message : 'Gagal membuat sesi pembayaran di iPaymu'
    );
    paymentError.isPaymentError = true;
    throw paymentError;
  }

  return {
    sessionId: result.Data.SessionID || null,
    paymentUrl: result.Data.Url,
  };
}

// Reference ID unik pesanan, contoh: ELK-20261017-A1B2C3
async function generateOrderReference(connection) {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 5; attempt += 1) {
    let suffix = '';
    for (let i = 0; i < 6; i += 1) {
      suffix += alphabet[crypto.randomInt(0, alphabet.length)];
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

// POST /api/orders (Public) - buat pesanan + sesi pembayaran iPaymu
app.post('/api/orders', async (req, res) => {
  if (!isIpaymuConfigured()) {
    return res.status(503).json({
      success: false,
      message: 'Payment gateway belum dikonfigurasi. Lengkapi IPAYMU_VA & IPAYMU_API_KEY di backend/.env',
    });
  }

  const { buyer_name, buyer_phone, buyer_email, address, city, notes, items } = req.body || {};

  const cleanName = String(buyer_name || '').trim();
  const cleanPhone = String(buyer_phone || '').trim();
  const cleanEmail = String(buyer_email || '').trim();
  const cleanAddress = String(address || '').trim();
  const cleanCity = String(city || '').trim();
  const cleanNotes = String(notes || '').trim();

  if (!cleanName || !cleanPhone || !cleanAddress || !cleanCity) {
    return res.status(400).json({ success: false, message: 'Nama, telepon, alamat, dan kota wajib diisi' });
  }
  if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
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
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'ipaymu')`,
      [referenceId, cleanName, cleanPhone, cleanEmail || null, cleanAddress, cleanCity, cleanNotes || null, subtotal, subtotal]
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

    // Buat sesi pembayaran iPaymu; kalau gagal, seluruh transaksi di-rollback
    const payment = await createIpaymuPaymentSession({
      referenceId,
      items: orderItems,
      buyer: { name: cleanName, phone: cleanPhone, email: cleanEmail },
    });

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
    res.status(400).json({ success: false, message: error.message || 'Gagal membuat pesanan' });
  } finally {
    connection.release();
  }
});

// POST /api/ipaymu/callback (Public) - webhook notifikasi pembayaran dari iPaymu
app.post('/api/ipaymu/callback', async (req, res) => {
  const { va } = getIpaymuConfig();
  const rawData = req.body || {};
  const receivedSignature = req.headers['x-signature'];

  try {
    if (!va) {
      console.error('iPaymu callback: IPAYMU_VA belum dikonfigurasi, signature tidak dapat divalidasi');
      return res.status(400).send('Invalid Signature');
    }
    if (!isValidIpaymuCallbackSignature(rawData, receivedSignature, va)) {
      console.warn('iPaymu callback: signature tidak valid');
      return res.status(400).send('Invalid Signature');
    }

    const referenceId = rawData.referenceId || rawData.reference_id;
    if (!referenceId) {
      return res.status(200).json({ status: 'OK', message: 'Callback tanpa reference_id diabaikan' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [orders] = await connection.query('SELECT * FROM orders WHERE reference_id = ? FOR UPDATE', [referenceId]);
      if (orders.length === 0) {
        await connection.rollback();
        return res.status(200).json({ status: 'OK', message: 'Pesanan tidak ditemukan, diabaikan' });
      }

      const order = orders[0];
      const statusCode = parseInt(rawData.status_code ?? rawData.transaction_status_code ?? 0, 10);
      const statusText = String(rawData.status || '').toLowerCase();

      if (statusCode === 1 || statusText === 'berhasil') {
        // Idempotent: jangan proses ulang kalau sudah paid
        if (order.status !== 'paid') {
          await connection.query(
            "UPDATE orders SET status = 'paid', paid_at = NOW(), ipaymu_trx_id = ?, payment_channel = ? WHERE id = ?",
            [
              rawData.trx_id !== undefined && rawData.trx_id !== null ? String(rawData.trx_id) : null,
              rawData.channel !== undefined && rawData.channel !== null ? String(rawData.channel) : null,
              order.id,
            ]
          );
          await applyOrderStockReduction(connection, order.id);
        }
      } else if (statusCode === -2 || statusText === 'expired') {
        if (order.status === 'pending') {
          await connection.query("UPDATE orders SET status = 'expired' WHERE id = ?", [order.id]);
        }
      }
      // status_code 0 / pending: tidak ada perubahan

      await connection.commit();
      res.status(200).json({ status: 'OK' });
    } catch (innerError) {
      await connection.rollback();
      throw innerError;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('iPaymu callback error:', error);
    res.status(500).json({ status: 'ERROR', message: 'Gagal memproses callback' });
  }
});

// GET /api/orders/reference/:referenceId (Public) - status pesanan untuk halaman pembeli
app.get('/api/orders/reference/:referenceId', async (req, res) => {
  const { referenceId } = req.params;
  try {
    const [orders] = await pool.query(
      `SELECT id, reference_id, buyer_name, city, subtotal, total, status, payment_url, paid_at, created_at
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


// Start server
app.listen(PORT, () => {
  console.log(`elkon backend server is running on port ${PORT}`);
});
