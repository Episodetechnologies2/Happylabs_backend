import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { dbQuery } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware with 10MB limit for image uploads
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Ensure uploads folder exists
if (!fs.existsSync(path.join(process.cwd(), 'uploads'))) {
  fs.mkdirSync(path.join(process.cwd(), 'uploads'), { recursive: true });
}

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Root Route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Happy Labs CMS API Server is running',
    version: '1.1.0',
    documentation: 'Enquiries removed. Focused purely on Portfolio and Dynamic Categories management.'
  });
});

// POST: Handle base64 image upload
app.post('/api/upload', (req, res) => {
  const { name, data } = req.body;
  
  if (!name || !data) {
    return res.status(400).json({ error: 'Filename and base64 data are required.' });
  }

  try {
    // Extract base64 data
    const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 data format.' });
    }

    const fileBuffer = Buffer.from(matches[2], 'base64');
    const extension = path.extname(name) || '.jpg';
    const baseName = path.basename(name, extension).replace(/[^a-zA-Z0-9]/g, '_');
    const uniqueName = `${baseName}_${Date.now()}${extension}`;
    const filePath = path.join(process.cwd(), 'uploads', uniqueName);

    fs.writeFileSync(filePath, fileBuffer);
    
    res.json({
      success: true,
      url: `/uploads/${uniqueName}`
    });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ error: 'Failed to upload file.' });
  }
});

/* ==========================================================================
   PORTFOLIO CRUD ENDPOINTS (with Status support)
   ========================================================================== */

// GET: Fetch all portfolio items sorted by date ascending
app.get('/api/portfolio', async (req, res) => {
  try {
    const items = await dbQuery.all('SELECT * FROM portfolio_items');
    
    // Sort chronologically (ascending: oldest first)
    items.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      const valA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
      const valB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
      if (valA !== valB) return valA - valB;
      return a.id - b.id; // Fallback to ID sorting
    });

    res.json(items);
  } catch (err) {
    console.error('Error fetching portfolio items:', err);
    res.status(500).json({ error: 'Failed to retrieve portfolio items from database' });
  }
});

// POST: Add a new portfolio item
app.post('/api/portfolio', async (req, res) => {
  const { category, title, date, img, lead, body, status } = req.body;

  // Simple validation
  if (!category || !title || !date || !img || !lead || !body) {
    return res.status(400).json({ error: 'All project fields are required.' });
  }

  const queryStatus = status || 'published';

  try {
    const result = await dbQuery.run(
      'INSERT INTO portfolio_items (category, title, date, img, lead, body, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [category, title, date, img, lead, body, queryStatus]
    );
    
    res.status(201).json({
      id: result.id,
      category,
      title,
      date,
      img,
      lead,
      body,
      status: queryStatus
    });
  } catch (err) {
    console.error('Error inserting portfolio item:', err);
    res.status(500).json({ error: 'Failed to save portfolio item to database' });
  }
});

// PUT: Update an existing portfolio item
app.put('/api/portfolio/:id', async (req, res) => {
  const { id } = req.params;
  const { category, title, date, img, lead, body, status } = req.body;

  if (!category || !title || !date || !img || !lead || !body) {
    return res.status(400).json({ error: 'All project fields are required.' });
  }

  const queryStatus = status || 'published';

  try {
    const existing = await dbQuery.get('SELECT * FROM portfolio_items WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }

    await dbQuery.run(
      'UPDATE portfolio_items SET category = ?, title = ?, date = ?, img = ?, lead = ?, body = ?, status = ? WHERE id = ?',
      [category, title, date, img, lead, body, queryStatus, id]
    );

    res.json({ id: parseInt(id), category, title, date, img, lead, body, status: queryStatus });
  } catch (err) {
    console.error('Error updating portfolio item:', err);
    res.status(500).json({ error: 'Failed to update portfolio item in database' });
  }
});

// DELETE: Remove a portfolio item
app.delete('/api/portfolio/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await dbQuery.get('SELECT * FROM portfolio_items WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }

    await dbQuery.run('DELETE FROM portfolio_items WHERE id = ?', [id]);
    res.json({ success: true, message: `Portfolio item ${id} deleted successfully` });
  } catch (err) {
    console.error('Error deleting portfolio item:', err);
    res.status(500).json({ error: 'Failed to delete portfolio item from database' });
  }
});


/* ==========================================================================
   CATEGORIES CRUD ENDPOINTS
   ========================================================================== */

// GET: Fetch all active categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await dbQuery.all('SELECT * FROM categories ORDER BY name ASC');
    res.json(categories.map(c => c.name));
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to retrieve categories from database' });
  }
});

// POST: Add a new custom category
app.post('/api/categories', async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  const normalized = name.trim().toLowerCase().replace(/\s+/g, '');

  try {
    await dbQuery.run('INSERT INTO categories (name) VALUES (?)', [normalized]);
    res.status(201).json({ success: true, name: normalized });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Category already exists' });
    }
    console.error('Error inserting category:', err);
    res.status(500).json({ error: 'Failed to save category to database' });
  }
});

// DELETE: Delete a category
app.delete('/api/categories/:name', async (req, res) => {
  const { name } = req.params;

  try {
    // Check if category is currently used by any portfolio item
    const used = await dbQuery.get('SELECT COUNT(*) as count FROM portfolio_items WHERE category = ?', [name]);
    if (used && used.count > 0) {
      return res.status(400).json({ error: 'Cannot delete category because it is currently assigned to projects.' });
    }

    await dbQuery.run('DELETE FROM categories WHERE name = ?', [name]);
    res.json({ success: true, message: `Category "${name}" deleted successfully` });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'Failed to delete category from database' });
  }
});

// POST: Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = await dbQuery.get(
      'SELECT * FROM users WHERE LOWER(username) = ? AND password = ?',
      [username.toLowerCase().trim(), password]
    );

    if (user) {
      res.json({ success: true, message: 'Authentication successful', user: { username: user.username } });
    } else {
      res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Database error during authentication' });
  }
});

// POST: Change Password endpoint
app.post('/api/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'All password fields are required' });
  }

  try {
    // Check if the current password is valid (for user 'Happy')
    const user = await dbQuery.get(
      'SELECT * FROM users WHERE LOWER(username) = ? AND password = ?',
      ['happy', currentPassword]
    );

    if (!user) {
      return res.status(401).json({ error: 'Incorrect current password' });
    }

    // Update password in the database
    await dbQuery.run(
      'UPDATE users SET password = ? WHERE LOWER(username) = ?',
      [newPassword, 'happy']
    );

    res.json({ success: true, message: 'Password updated successfully in database' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Failed to update password in database' });
  }
});




// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start listening
app.listen(PORT, () => {
  console.log(`===========================================`);
  console.log(`  Express Server running on port ${PORT}`);
  console.log(`  API Base: http://localhost:${PORT}`);
  console.log(`===========================================`);
});
