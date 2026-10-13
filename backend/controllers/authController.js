const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const FileModel = require('../models/fileModel');
const { generateToken } = require('../config/jwt');

// Email regex pattern for validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class AuthController {
  static async register(req, res) {
    try {
      const { name, email, password } = req.body;

      // Validation
      if (!name || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Full name is required (minimum 2 characters).',
        });
      }

      if (!email || !EMAIL_REGEX.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: 'A valid email address is required.',
        });
      }

      if (!password || password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long.',
        });
      }

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email address already exists.',
        });
      }

      // Hash password securely with bcrypt
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const userId = await UserModel.create({
        name: name.trim(),
        email: email.trim(),
        passwordHash,
        role: 'user',
      });

      const user = await UserModel.findById(userId);

      // Generate JWT
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return res.status(201).json({
        success: true,
        message: 'Account registered successfully.',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Registration failed due to a server error. Please try again.',
      });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required.',
        });
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password credentials.',
        });
      }

      // Verify bcrypt password hash
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password credentials.',
        });
      }

      // Generate JWT token
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return res.json({
        success: true,
        message: 'Logged in successfully.',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Login failed due to a server error. Please try again.',
      });
    }
  }

  static async getProfile(req, res) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.',
        });
      }

      const stats = await FileModel.getUserStorageStats(user.id);

      return res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
          stats,
        },
      });
    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile data.',
      });
    }
  }
}

module.exports = AuthController;
