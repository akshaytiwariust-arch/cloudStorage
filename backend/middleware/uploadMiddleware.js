const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 10 MB file size limit in bytes
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Generate a secure unique identifier
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    // Sanitize extension (alphanumeric only)
    const safeExt = ext.replace(/[^a-zA-Z0-9.]/g, '');
    cb(null, `${uniqueId}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

// Middleware to handle Multer errors gracefully
function handleUploadErrors(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File upload rejected: File exceeds the maximum 10 MB limit per file.',
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field encountered during upload.',
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  } else if (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Error occurred while uploading file.',
    });
  }
  next();
}

module.exports = {
  upload,
  handleUploadErrors,
  UPLOAD_DIR,
  MAX_FILE_SIZE,
};
