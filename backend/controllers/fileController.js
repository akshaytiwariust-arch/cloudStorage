const path = require('path');
const fs = require('fs');
const FileModel = require('../models/fileModel');
const { UPLOAD_DIR, MAX_FILE_SIZE } = require('../middleware/uploadMiddleware');

// Storage quota per normal user (e.g., 100 MB default)
const USER_STORAGE_LIMIT_BYTES = 100 * 1024 * 1024;

class FileController {
  static async uploadFiles(req, res) {
    try {
      const files = req.files || (req.file ? [req.file] : []);

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files were selected for upload.',
        });
      }

      const uploadedResults = [];

      for (const file of files) {
        // Enforce 10 MB limit check on backend per individual file
        if (file.size > MAX_FILE_SIZE) {
          // Remove the physical file if it slipped through
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
          return res.status(400).json({
            success: false,
            message: `File "${file.originalname}" exceeds the maximum 10 MB file size limit.`,
          });
        }

        const fileRecordId = await FileModel.create({
          userId: req.user.id,
          originalFilename: file.originalname,
          storedFilename: file.filename,
          fileType: file.mimetype || 'application/octet-stream',
          fileSize: file.size,
          filePath: file.path,
        });

        const createdFile = await FileModel.findById(fileRecordId);
        uploadedResults.push(createdFile);
      }

      // Fetch updated storage stats for user
      const stats = await FileModel.getUserStorageStats(req.user.id);

      return res.status(201).json({
        success: true,
        message: `${files.length} file(s) uploaded successfully.`,
        files: uploadedResults,
        stats: {
          ...stats,
          storageLimitBytes: USER_STORAGE_LIMIT_BYTES,
          availableStorageBytes: Math.max(0, USER_STORAGE_LIMIT_BYTES - stats.totalStorageBytes),
        },
      });
    } catch (error) {
      console.error('File upload error:', error);
      return res.status(500).json({
        success: false,
        message: 'File upload failed due to a server error.',
      });
    }
  }

  static async listUserFiles(req, res) {
    try {
      const searchQuery = req.query.search || '';
      const files = await FileModel.findByUser(req.user.id, searchQuery);
      const stats = await FileModel.getUserStorageStats(req.user.id);

      return res.json({
        success: true,
        files,
        stats: {
          totalFiles: stats.totalFiles,
          totalStorageBytes: stats.totalStorageBytes,
          storageLimitBytes: USER_STORAGE_LIMIT_BYTES,
          availableStorageBytes: Math.max(0, USER_STORAGE_LIMIT_BYTES - stats.totalStorageBytes),
        },
      });
    } catch (error) {
      console.error('List files error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve files list.',
      });
    }
  }

  static async downloadFile(req, res) {
    try {
      const fileId = req.params.id;
      const file = await FileModel.findById(fileId);

      if (!file) {
        return res.status(404).json({
          success: false,
          message: 'Requested file not found.',
        });
      }

      // Authorization & IDOR protection: User must own the file OR be an admin
      if (file.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not have permission to download this file.',
        });
      }

      const filePath = path.resolve(file.file_path);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'File content is missing from server storage.',
        });
      }

      // Stream file to client with original filename
      res.setHeader('Content-Type', file.file_type || 'application/octet-stream');
      return res.download(filePath, file.original_filename);
    } catch (error) {
      console.error('Download file error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to download file.',
      });
    }
  }

  static async deleteFile(req, res) {
    try {
      const fileId = req.params.id;
      const file = await FileModel.findById(fileId);

      if (!file) {
        return res.status(404).json({
          success: false,
          message: 'Requested file does not exist.',
        });
      }

      // Authorization & IDOR protection: User must own the file OR be an admin
      if (file.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not have permission to delete this file.',
        });
      }

      // Remove actual stored file from disk
      const filePath = path.resolve(file.file_path);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (fsErr) {
          console.warn(`Could not delete file from disk: ${fsErr.message}`);
        }
      }

      // Delete metadata record from database
      await FileModel.deleteById(fileId);

      // Return updated user stats
      const stats = await FileModel.getUserStorageStats(req.user.id);

      return res.json({
        success: true,
        message: `File "${file.original_filename}" was permanently deleted.`,
        stats: {
          ...stats,
          storageLimitBytes: USER_STORAGE_LIMIT_BYTES,
          availableStorageBytes: Math.max(0, USER_STORAGE_LIMIT_BYTES - stats.totalStorageBytes),
        },
      });
    } catch (error) {
      console.error('Delete file error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete file.',
      });
    }
  }

  static async getUserStats(req, res) {
    try {
      const stats = await FileModel.getUserStorageStats(req.user.id);
      return res.json({
        success: true,
        stats: {
          totalFiles: stats.totalFiles,
          totalStorageBytes: stats.totalStorageBytes,
          storageLimitBytes: USER_STORAGE_LIMIT_BYTES,
          availableStorageBytes: Math.max(0, USER_STORAGE_LIMIT_BYTES - stats.totalStorageBytes),
        },
      });
    } catch (error) {
      console.error('Get stats error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve storage statistics.',
      });
    }
  }
}

module.exports = FileController;
