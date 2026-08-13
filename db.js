import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbFile = process.env.DATABASE_FILE || 'database.sqlite';
const dbPath = path.resolve(__dirname, dbFile);

// Check if database file exists before opening it (so we know if we need to seed it)
const dbExists = fs.existsSync(dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log(`Connected to SQLite database: ${dbFile}`);
    if (!dbExists) {
      console.log('New database detected. Running initialization schema...');
      initializeDatabase();
    }
  }
});

// Helper to run schema.sql for table creation & seeding
function initializeDatabase() {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error('schema.sql file not found! Unable to initialize database tables.');
    return;
  }

  const sqlContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Split statements by semicolon (removing comments and blank lines)
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

  db.serialize(() => {
    statements.forEach((statement) => {
      db.run(statement, (err) => {
        if (err) {
          console.error(`SQL execution error during init: ${statement.substring(0, 50)}...\n`, err.message);
        }
      });
    });
    console.log('Database tables successfully created and seeded with default data!');
  });
}

// Promise-based wrappers for SQLite operations
export const dbQuery = {
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }
};

export default db;
