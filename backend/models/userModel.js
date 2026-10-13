const { query } = require('../config/db');

class UserModel {
  static async findByEmail(email) {
    const rows = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email.toLowerCase().trim()]);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  static async findById(id) {
    const rows = await query('SELECT id, name, email, role, created_at FROM users WHERE id = ? LIMIT 1', [id]);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  static async create({ name, email, passwordHash, role = 'user' }) {
    const result = await query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), passwordHash, role]
    );
    return result.insertId;
  }

  static async getAllUsers() {
    // Return all users with their aggregate total uploaded files and storage used
    const sql = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.created_at,
        COUNT(f.id) AS file_count,
        COALESCE(SUM(f.file_size), 0) AS total_storage_bytes
      FROM users u
      LEFT JOIN files f ON u.id = f.user_id
      GROUP BY u.id, u.name, u.email, u.role, u.created_at
      ORDER BY u.created_at DESC
    `;
    const rows = await query(sql);
    return rows;
  }

  static async deleteUser(id) {
    // When a user is deleted, their files should also be deleted
    const result = await query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async countAll() {
    const rows = await query('SELECT COUNT(*) AS total_users FROM users');
    return rows[0]?.total_users || 0;
  }
}

module.exports = UserModel;
