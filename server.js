import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { dbQuery } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

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

/* ==========================================================================
   PORTFOLIO CRUD ENDPOINTS (with Status support)
   ========================================================================== */

// GET: Fetch all portfolio items
app.get('/api/portfolio', async (req, res) => {
  try {
    const items = await dbQuery.all('SELECT * FROM portfolio_items ORDER BY id DESC');
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
