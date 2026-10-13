const path = require('path');
const fs = require('fs');
const UserModel = require('../models/userModel');
const FileModel = require('../models/fileModel');

class AdminController {
  // Get all users with file count & total storage
  static async listUsers(req, res) {
    try {
      const users = await UserModel.getAllUsers();
      return res.json({
        success: true,
        users,
      });
    } catch (error) {
      console.error('Admin list users error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve users list.',
      });
    }
  }

  // Delete a user and clean up all their physical files from disk
  static async deleteUser(req, res) {
    try {
      const userId = req.params.id;

      // Prevent self-deletion of currently logged in admin
      if (parseInt(userId, 10) === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Admins cannot delete their own account.',
        });
      }

      const targetUser = await UserModel.findById(userId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'User does not exist.',
        });
      }

      // Fetch user's files and remove them from disk
      const userFiles = await FileModel.getFilesByUserId(userId);
      for (const file of userFiles) {
        const filePath = path.resolve(file.file_path);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            console.warn(`Could not delete file ${filePath} from disk:`, e.message);
          }
        }
      }

      // Delete user (cascade will also remove files in DB, or delete directly)
      await UserModel.deleteUser(userId);

      return res.json({
        success: true,
        message: `User ${targetUser.name} (${targetUser.email}) and all their uploaded files were deleted.`,
      });
    } catch (error) {
      console.error('Admin delete user error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete user.',
      });
    }
  }

  // List all files from all users with uploader details
  static async listAllFiles(req, res) {
    try {
      const searchQuery = req.query.search || '';
      const files = await FileModel.getAllFiles(searchQuery);
      return res.json({
        success: true,
        files,
      });
    } catch (error) {
      console.error('Admin list files error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve all files.',
      });
    }
  }

  // Delete any file (admin privilege)
  static async deleteFile(req, res) {
    try {
      const fileId = req.params.id;
      const file = await FileModel.findById(fileId);

      if (!file) {
        return res.status(404).json({
          success: false,
          message: 'File not found.',
        });
      }

      // Remove from disk
      const filePath = path.resolve(file.file_path);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn(`Could not remove file ${filePath}:`, e.message);
        }
      }

      // Remove from database
      await FileModel.deleteById(fileId);

      return res.json({
        success: true,
        message: `File "${file.original_filename}" was permanently deleted by Administrator.`,
      });
    } catch (error) {
      console.error('Admin delete file error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete file.',
      });
    }
  }

  // Global storage and system overview statistics
  static async getOverviewStats(req, res) {
    try {
      const totalUsers = await UserModel.countAll();
      const storageStats = await FileModel.getGlobalStorageStats();

      return res.json({
        success: true,
        stats: {
          totalUsers: parseInt(totalUsers, 10),
          totalFiles: storageStats.totalFiles,
          totalStorageBytes: storageStats.totalStorageBytes,
        },
      });
    } catch (error) {
      console.error('Admin get stats error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve admin statistics.',
      });
    }
  }
}

module.exports = AdminController;
