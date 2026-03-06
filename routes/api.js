const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDB } = require('../lib/dbConnect');

const SALT_ROUNDS = 10;

// --- File Upload ---
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + ext);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// --- Auth Middleware ---
async function authenticate(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const db = await getDB();
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.session.userId) });
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

// =====================
//   AUTH
// =====================

router.get('/me', authenticate, (req, res) => {
  const { password, ...user } = req.user;
  res.json(user);
});

router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const db = await getDB();
    const user = await db.collection('users').findOne({ username });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    req.session.userId = String(user._id);
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/auth/signup', async (req, res) => {
  try {
    const { fullname, username, email, tel, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const db = await getDB();
    const existing = await db.collection('users').findOne({ username });
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    const result = await db.collection('users').insertOne({
      name: fullname,
      username,
      email,
      tel,
      password: bcrypt.hashSync(password, SALT_ROUNDS),
      favoriteListings: [],
    });
    res.status(201).json({ _id: result.insertedId, username });
  } catch (err) {
    res.status(500).json({ error: 'Signup failed' });
  }
});

router.post('/auth/demo', async (req, res) => {
  try {
    const db = await getDB();
    const DEMO_USERNAME = 'demo';
    let user = await db.collection('users').findOne({ username: DEMO_USERNAME });
    if (!user) {
      const result = await db.collection('users').insertOne({
        name: 'Demo User',
        username: DEMO_USERNAME,
        email: 'demo@bargain.com',
        tel: '555-0100',
        password: bcrypt.hashSync('demo', SALT_ROUNDS),
        favoriteListings: [],
      });
      user = await db.collection('users').findOne({ _id: result.insertedId });

      // Seed demo listings
      const demoListings = [
        {
          sellerId: String(user._id),
          username: DEMO_USERNAME,
          title: 'Labubu Plush Collectible',
          price: 45,
          quantity: 1,
          description: 'Rare Labubu plush toy in excellent condition. Perfect for collectors! Comes with original packaging and authentication card.',
          category: 'other',
          latitude: 40.7128,
          longitude: -74.006,
          email: 'demo@bargain.com',
          tel: '555-0100',
          images: ['/images/demo/labubu.jpg'],
          favoriteUsers: [],
          createdAt: new Date(),
        },
        {
          sellerId: String(user._id),
          username: DEMO_USERNAME,
          title: 'MacBook Pro 16" — Like New',
          price: 1899,
          quantity: 1,
          description: 'MacBook Pro 16-inch, M3 Pro chip, 18GB RAM, 512GB SSD. Barely used, less than 50 battery cycles. Includes original charger and box.',
          category: 'electronics',
          latitude: 40.7282,
          longitude: -73.7949,
          email: 'demo@bargain.com',
          tel: '555-0100',
          images: ['/images/demo/macbook.jpg'],
          favoriteUsers: [],
          createdAt: new Date(Date.now() - 86400000),
        },
        {
          sellerId: String(user._id),
          username: DEMO_USERNAME,
          title: 'Mid-Century Modern Accent Chairs (Set of 2)',
          price: 320,
          quantity: 2,
          description: 'Beautiful pair of mid-century modern accent chairs with vibrant upholstery and solid wood legs. Great conversation starters for any living room.',
          category: 'home',
          latitude: 40.7589,
          longitude: -73.9851,
          email: 'demo@bargain.com',
          tel: '555-0100',
          images: ['/images/demo/chair.jpg'],
          favoriteUsers: [],
          createdAt: new Date(Date.now() - 172800000),
        },
      ];
      await db.collection('listings').insertMany(demoListings);
    }
    req.session.userId = String(user._id);
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    console.error('Demo login error:', err.message);
    res.status(500).json({ error: 'Demo login failed: ' + err.message });
  }
});

router.post('/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.status(204).end();
  });
});

// =====================
//   LISTINGS
// =====================

router.get('/listings', async (req, res) => {
  try {
    const db = await getDB();
    const listings = await db.collection('listings').find({}).toArray();
    res.json(listings);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch listings' });
  }
});

router.get('/listings/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    const filter = {};
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.title = { $regex: escaped, $options: 'i' };
    }
    const db = await getDB();
    const listings = await db.collection('listings').find(filter).toArray();
    res.json(listings);
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

router.get('/listings/:id', async (req, res) => {
  try {
    const db = await getDB();
    const listing = await db.collection('listings').findOne({ _id: new ObjectId(req.params.id) });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json(listing);
  } catch (err) {
    res.status(400).json({ error: 'Invalid listing ID' });
  }
});

router.post('/listings', authenticate, upload.array('images', 5), async (req, res) => {
  try {
    const { title, price, quantity, description, category, latitude, longitude } = req.body;
    if (!title || price == null) {
      return res.status(400).json({ error: 'Title and price required' });
    }
    const images = (req.files || []).map(f => '/uploads/' + f.filename);
    const db = await getDB();
    const result = await db.collection('listings').insertOne({
      sellerId: String(req.session.userId),
      username: req.user.username,
      title,
      price: Number(price),
      quantity: Number(quantity) || 1,
      description: description || '',
      category: category || 'other',
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      email: req.user.email,
      tel: req.user.tel,
      images,
      favoriteUsers: [],
      createdAt: new Date(),
    });
    res.status(201).json({ _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: 'Could not create listing' });
  }
});

router.put('/listings/:id', authenticate, async (req, res) => {
  try {
    const { title, price, quantity, description, category } = req.body;
    const db = await getDB();
    const result = await db.collection('listings').findOneAndUpdate(
      { _id: new ObjectId(req.params.id), sellerId: String(req.session.userId) },
      { $set: { title, price: Number(price), quantity: Number(quantity), description, category } },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ error: 'Listing not found or not yours' });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: 'Update failed' });
  }
});

router.delete('/listings/:id', authenticate, async (req, res) => {
  try {
    const db = await getDB();
    await db.collection('listings').deleteOne({
      _id: new ObjectId(req.params.id),
      sellerId: String(req.session.userId),
    });
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ error: 'Delete failed' });
  }
});

// =====================
//   PROFILE & FAVORITES
// =====================

router.get('/profile', authenticate, async (req, res) => {
  try {
    const db = await getDB();
    const listings = await db.collection('listings')
      .find({ sellerId: String(req.session.userId) }).toArray();

    const favIds = (req.user.favoriteListings || []).map(id => {
      try { return new ObjectId(id); } catch (e) { return null; }
    }).filter(Boolean);

    const favorites = favIds.length
      ? await db.collection('listings').find({ _id: { $in: favIds } }).toArray()
      : [];

    const { password, ...user } = req.user;
    res.json({ user, listings, favorites });
  } catch (err) {
    res.status(500).json({ error: 'Could not load profile' });
  }
});

router.post('/favorites/:id', authenticate, async (req, res) => {
  try {
    const db = await getDB();
    await db.collection('users').updateOne(
      { _id: new ObjectId(req.session.userId) },
      { $addToSet: { favoriteListings: req.params.id } }
    );
    await db.collection('listings').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $addToSet: { favoriteUsers: req.user.username } }
    );
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ error: 'Could not add favorite' });
  }
});

router.delete('/favorites/:id', authenticate, async (req, res) => {
  try {
    const db = await getDB();
    await db.collection('users').updateOne(
      { _id: new ObjectId(req.session.userId) },
      { $pull: { favoriteListings: req.params.id } }
    );
    await db.collection('listings').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $pull: { favoriteUsers: req.user.username } }
    );
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ error: 'Could not remove favorite' });
  }
});

module.exports = router;
