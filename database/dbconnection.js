const mongoose = require('mongoose');
require('dotenv').config();
const dbstring = process.env.MONGO_URI || process.env.DBSTRING;

const connectDB = async () => {
  if (!dbstring) {
    console.log('error connecting to db Error: Missing MONGO_URI/DBSTRING in .env');
    process.exit(1);
  }

  try {
    console.log('connecting to db ...');
    await mongoose.connect(dbstring);
    console.log('connection to db successful!🙂✔️');
  } catch (error) {
    console.log('error connecting to db', error);
    process.exit(1);
  }
};

module.exports = connectDB;
