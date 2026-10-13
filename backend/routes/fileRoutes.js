const express = require('express');
const router = express.Router();
const FileController = require('../controllers/fileController');
const { authenticate } = require('../middleware/authMiddleware');
const { upload, handleUploadErrors } = require('../middleware/uploadMiddleware');

// All file routes require authentication
router.use(authenticate);

// Upload single or multiple files (max 10 files per request, 10MB limit per file)
router.post(
  '/upload',
  (req, res, next) => {
    upload.array('files', 10)(req, res, (err) => {
      handleUploadErrors(err, req, res, next);
    });
  },
  FileController.uploadFiles
);

// Get current user's files (with optional search query)
router.get('/', FileController.listUserFiles);

// Get storage statistics for logged in user
router.get('/stats', FileController.getUserStats);

// Download a file
router.get('/:id/download', FileController.downloadFile);

// Delete a file
router.delete('/:id', FileController.deleteFile);

module.exports = router;
