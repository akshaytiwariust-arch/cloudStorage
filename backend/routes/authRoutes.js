const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// Public auth endpoints
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Protected user profile
router.get('/me', authenticate, AuthController.getProfile);

module.exports = router;
