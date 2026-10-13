const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const FileController = require('../controllers/fileController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

// All admin routes require authentication AND admin role
router.use(authenticate, requireAdmin);

// Storage & user counts overview
router.get('/stats', AdminController.getOverviewStats);

// User management
router.get('/users', AdminController.listUsers);
router.delete('/users/:id', AdminController.deleteUser);

// File management across all users
router.get('/files', AdminController.listAllFiles);
router.delete('/files/:id', AdminController.deleteFile);

// Allow admin to download any file
router.get('/files/:id/download', FileController.downloadFile);

module.exports = router;
