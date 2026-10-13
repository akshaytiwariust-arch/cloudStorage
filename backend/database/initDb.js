const { initDb } = require('../config/db');

async function run() {
  console.log('[InitDb] Starting database initialization...');
  try {
    await initDb();
    console.log('[InitDb] Database tables initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[InitDb] Error initializing database:', error);
    process.exit(1);
  }
}

run();
