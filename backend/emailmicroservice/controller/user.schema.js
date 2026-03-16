const mongoose = require('mongoose');

const SCHEMA = mongoose.Schema;

const userschema = new SCHEMA(
  {
    customer_name: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, 'Name should not be less than 3 characters'],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.user || mongoose.model('user', userschema);
