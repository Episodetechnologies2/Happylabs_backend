import sqlite3 from 'sqlite3';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine database mode
const useMySQL = !!(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME);

let mysqlPool = null;
let sqliteDb = null;

if (useMySQL) {
  console.log('MySQL configurations detected. Initializing MySQL connection pool...');
  mysqlPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD === 'YOUR_DB_PASSWORD' ? '' : process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true // Required to run multi-query schema.sql script
  });

  // Verify connection and run migrations
  verifyAndInitializeMySQL();
} else {
  console.log('No MySQL configuration or default placeholders detected. Using SQLite...');
  initializeSQLite();
}

// MySQL connection validation and initialization
async function verifyAndInitializeMySQL() {
  try {
    const connection = await mysqlPool.getConnection();
    console.log(`Connected to MySQL database: ${process.env.DB_NAME}`);

    // Check if tables exist. If categories doesn't exist, initialize schema.
    const [rows] = await connection.query("SHOW TABLES LIKE 'categories'");
    if (rows.length === 0) {
      console.log('MySQL database tables not detected. Initializing schema...');
      await initializeMySQLDatabase(connection);
    } else {
      console.log('MySQL database tables verified.');
    }
    connection.release();
  } catch (err) {
    console.error('Error connecting to MySQL database:', err.message);
    console.log('Falling back to local SQLite database...');
    mysqlPool = null; // Reset pool so queries fallback to SQLite
    initializeSQLite();
  }
}

async function initializeMySQLDatabase(connection) {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error('schema.sql file not found! Unable to initialize database tables.');
    return;
  }

  const sqlContent = fs.readFileSync(schemaPath, 'utf8');
  try {
    await connection.query(sqlContent);
    console.log('MySQL database tables successfully created and seeded with default data!');
  } catch (err) {
    console.error('SQL execution error during MySQL init:', err.message);
  }
}

// SQLite connection and initialization
function initializeSQLite() {
  const dbFile = process.env.DATABASE_FILE || 'database.sqlite';
  const dbPath = path.resolve(process.cwd(), dbFile);
  const dbExists = fs.existsSync(dbPath) && fs.statSync(dbPath).size > 0;

  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error connecting to SQLite database:', err.message);
    } else {
      console.log(`Connected to SQLite database: ${dbFile}`);
      if (!dbExists) {
        console.log('New or empty SQLite database detected. Running initialization schema...');
        initializeSQLiteDatabase();
      }
    }
  });
}

function initializeSQLiteDatabase() {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error('schema.sql file not found! Unable to initialize SQLite database tables.');
    return;
  }

  const sqlContent = fs.readFileSync(schemaPath, 'utf8');

  // Remove SQL line comments before splitting
  const cleanSql = sqlContent
    .split('\n')
    .map(line => {
      const idx = line.indexOf('--');
      return idx !== -1 ? line.substring(0, idx) : line;
    })
    .join('\n');

  // Split statements by semicolon (removing blank lines)
  const statements = cleanSql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  sqliteDb.serialize(() => {
    statements.forEach((statement) => {
      sqliteDb.run(statement, (err) => {
        if (err) {
          console.error(`SQL execution error during SQLite init: ${statement.substring(0, 50)}...\n`, err.message);
        }
      });
    });
    console.log('SQLite database tables successfully created and seeded with default data!');
  });
}

// Promise-based query wrapper that dynamically routes queries to the active database
export const dbQuery = {
  async all(sql, params = []) {
    if (mysqlPool) {
      const [rows] = await mysqlPool.query(sql, params);
      return rows;
    } else {
      return new Promise((resolve, reject) => {
        sqliteDb.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    }
  },

  async get(sql, params = []) {
    if (mysqlPool) {
      const [rows] = await mysqlPool.query(sql, params);
      return rows[0] || null;
    } else {
      return new Promise((resolve, reject) => {
        sqliteDb.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row || null);
        });
      });
    }
  },

  async run(sql, params = []) {
    if (mysqlPool) {
      const [result] = await mysqlPool.query(sql, params);
      return {
        id: result.insertId,
        changes: result.affectedRows
      };
    } else {
      return new Promise((resolve, reject) => {
        sqliteDb.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, changes: this.changes });
        });
      });
    }
  }
};

export default { mysqlPool, sqliteDb };
// Trigger nodemon restart for remote MySQL connection
