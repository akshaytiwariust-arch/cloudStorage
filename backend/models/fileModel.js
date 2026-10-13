const { query } = require('../config/db');

class FileModel {
  static async create({ userId, originalFilename, storedFilename, fileType, fileSize, filePath }) {
    const result = await query(
      `INSERT INTO files (user_id, original_filename, stored_filename, file_type, file_size, file_path) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, originalFilename, storedFilename, fileType, fileSize, filePath]
    );
    return result.insertId;
  }

  static async findById(id) {
    const rows = await query('SELECT * FROM files WHERE id = ? LIMIT 1', [id]);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  static async findByUser(userId, searchQuery = '') {
    if (searchQuery && searchQuery.trim() !== '') {
      const pattern = `%${searchQuery.trim()}%`;
      return await query(
        `SELECT id, user_id, original_filename, stored_filename, file_type, file_size, file_path, uploaded_at 
         FROM files 
         WHERE user_id = ? AND original_filename LIKE ? 
         ORDER BY uploaded_at DESC`,
        [userId, pattern]
      );
    }
    return await query(
      `SELECT id, user_id, original_filename, stored_filename, file_type, file_size, file_path, uploaded_at 
       FROM files 
       WHERE user_id = ? 
       ORDER BY uploaded_at DESC`,
      [userId]
    );
  }

  static async getAllFiles(searchQuery = '') {
    // Joins users table to include uploader's name and email
    if (searchQuery && searchQuery.trim() !== '') {
      const pattern = `%${searchQuery.trim()}%`;
      const sql = `
        SELECT 
          f.id, 
          f.user_id, 
          f.original_filename, 
          f.stored_filename, 
          f.file_type, 
          f.file_size, 
          f.file_path, 
          f.uploaded_at,
          u.name AS uploader_name,
          u.email AS uploader_email
        FROM files f
        JOIN users u ON f.user_id = u.id
        WHERE f.original_filename LIKE ? OR u.name LIKE ? OR u.email LIKE ?
        ORDER BY f.uploaded_at DESC
      `;
      return await query(sql, [pattern, pattern, pattern]);
    }

    const sql = `
      SELECT 
        f.id, 
        f.user_id, 
        f.original_filename, 
        f.stored_filename, 
        f.file_type, 
        f.file_size, 
        f.file_path, 
        f.uploaded_at,
        u.name AS uploader_name,
        u.email AS uploader_email
      FROM files f
      JOIN users u ON f.user_id = u.id
      ORDER BY f.uploaded_at DESC
    `;
    return await query(sql);
  }

  static async deleteById(id) {
    const result = await query('DELETE FROM files WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getUserStorageStats(userId) {
    const rows = await query(
      `SELECT 
         COUNT(*) AS total_files, 
         COALESCE(SUM(file_size), 0) AS total_storage_bytes 
       FROM files 
       WHERE user_id = ?`,
      [userId]
    );
    return {
      totalFiles: parseInt(rows[0]?.total_files || 0, 10),
      totalStorageBytes: parseInt(rows[0]?.total_storage_bytes || 0, 10),
    };
  }

  static async getGlobalStorageStats() {
    const rows = await query(
      `SELECT 
         COUNT(*) AS total_files, 
         COALESCE(SUM(file_size), 0) AS total_storage_bytes 
       FROM files`
    );
    return {
      totalFiles: parseInt(rows[0]?.total_files || 0, 10),
      totalStorageBytes: parseInt(rows[0]?.total_storage_bytes || 0, 10),
    };
  }

  static async getFilesByUserId(userId) {
    return await query('SELECT * FROM files WHERE user_id = ?', [userId]);
  }
}

module.exports = FileModel;
