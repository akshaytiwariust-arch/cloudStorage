const bcrypt = require('bcryptjs');
const { initDb } = require('../config/db');
const UserModel = require('../models/userModel');

async function seedAdmin() {
  await initDb();

  const args = process.argv.slice(2);
  const email = (args[0] || process.env.ADMIN_EMAIL || 'admin@cloud.com').toLowerCase().trim();
  const password = args[1] || process.env.ADMIN_PASSWORD || 'Admin@12345';
  const name = args[2] || process.env.ADMIN_NAME || 'System Administrator';

  try {
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      const passwordHash = await bcrypt.hash(password, 10);
      const { query } = require('../config/db');
      await query('UPDATE users SET role = ?, password_hash = ?, name = ? WHERE id = ?', [
        'admin',
        passwordHash,
        name,
        existing.id,
      ]);
      console.log(`[SeedAdmin] Existing user "${email}" updated to role "admin" with updated password!`);
    } else {
      const passwordHash = await bcrypt.hash(password, 10);
      const userId = await UserModel.create({
        name,
        email,
        passwordHash,
        role: 'admin',
      });
      console.log(`[SeedAdmin] Created new Administrator account! ID: ${userId}`);
    }

    console.log('==========================================');
    console.log('Admin Account Ready:');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Name:     ${name}`);
    console.log(`Role:     admin`);
    console.log('==========================================');
    process.exit(0);
  } catch (err) {
    console.error('[SeedAdmin] Failed to seed admin:', err);
    process.exit(1);
  }
}

seedAdmin();
