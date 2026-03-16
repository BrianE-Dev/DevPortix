const mongoose = require('mongoose');

const DBconnect = async () => {
  const dbstring = process.env.MONGO_URI || process.env.DBSTRING || '';

  if (!dbstring) {
    console.warn('[email-service] MONGO_URI/DBSTRING not set. Starting without database connection.');
    return;
  }

  try {
    await mongoose.connect(dbstring);
    console.log('[email-service] Database connected');
  } catch (error) {
    console.error('[email-service] Failed to connect to database:', error.message);
    process.exit(1);
  }
};

module.exports = DBconnect;
