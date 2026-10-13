const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

let clientType = (process.env.DB_CLIENT || 'mysql').toLowerCase();
let mysqlPool = null;
let sqliteDb = null;

// Initialize Database connection and tables
async function initDb() {
  if (clientType === 'mysql') {
    try {
      // First connect without database to ensure DB exists
      const tempConnection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
      });

      const dbName = process.env.DB_NAME || 'cloud_storage';
      await tempConnection.query(
        `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
      );
      await tempConnection.end();

      // Now create connection pool to the specific database
      mysqlPool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: dbName,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });

      // Test connection
      const connection = await mysqlPool.getConnection();
      connection.release();

      // Create MySQL tables
      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_users_email (email),
          INDEX idx_users_role (role)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS files (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          original_filename VARCHAR(255) NOT NULL,
          stored_filename VARCHAR(255) NOT NULL UNIQUE,
          file_type VARCHAR(100) NOT NULL,
          file_size BIGINT NOT NULL,
          file_path VARCHAR(500) NOT NULL,
          uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_files_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_files_user_id (user_id),
          INDEX idx_files_uploaded_at (uploaded_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      console.log(`[Database] Connected successfully to MySQL database "${dbName}"`);
      return;
    } catch (err) {
      console.warn(`[Database Warning] MySQL connection failed: ${err.message}`);
      console.warn(`[Database Fallback] Falling back to zero-configuration SQLite for immediate operation.`);
      console.warn(`[Database Note] To use MySQL, configure DB_USER and DB_PASSWORD in backend/.env with your MySQL credentials.`);
      clientType = 'sqlite';
    }
  }

  // SQLite Initialization (Zero-config fallback or explicit DB_CLIENT=sqlite)
  const dbDir = path.join(__dirname, '..', 'database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = path.join(dbDir, 'cloud_storage.sqlite');

  await new Promise((resolve, reject) => {
    sqliteDb = new sqlite3.Database(dbPath, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });

  // Enable foreign keys in SQLite
  await new Promise((resolve, reject) => {
    sqliteDb.run('PRAGMA foreign_keys = ON;', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // Create SQLite tables
  await new Promise((resolve, reject) => {
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `, (err) => (err ? reject(err) : resolve()));
  });

  await new Promise((resolve, reject) => {
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        original_filename TEXT NOT NULL,
        stored_filename TEXT NOT NULL UNIQUE,
        file_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `, (err) => (err ? reject(err) : resolve()));
  });

  console.log(`[Database] Connected successfully to SQLite database at ${dbPath}`);
}

// Unified query runner for parameterized queries (preventing SQL injection)
async function query(sql, params = []) {
  if (clientType === 'mysql' && mysqlPool) {
    const [rows, fields] = await mysqlPool.execute(sql, params);
    return rows;
  }

  // SQLite execution
  return new Promise((resolve, reject) => {
    const trimmed = sql.trim().toUpperCase();
    if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA')) {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    } else {
      sqliteDb.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve({
          insertId: this.lastID,
          affectedRows: this.changes,
        });
      });
    }
  });
}

function getClientType() {
  return clientType;
}

module.exports = {
  initDb,
  query,
  getClientType,
};
