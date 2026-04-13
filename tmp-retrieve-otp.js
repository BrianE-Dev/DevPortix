require("dotenv").config();
const mongoose = require("mongoose");
const crypto = require("crypto");

const DB = process.env.MONGO_URI || process.env.DBSTRING;
const email = "test+copilot20260413@mailinator.com";
const purpose = "registration";
const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();
const hashOtp = (emailValue, purposeValue, otp) =>
  crypto
    .createHash("sha256")
    .update(
      `${normalize(emailValue)}:${normalize(purposeValue)}:${String(otp)}`,
    )
    .digest("hex");

(async () => {
  if (!DB) {
    console.error("Missing DB connection string");
    process.exit(1);
  }

  await mongoose.connect(DB, { dbName: "test" });
  const coll = mongoose.connection.collection("otptokens");
  const doc = await coll.findOne({
    email: normalize(email),
    purpose: normalize(purpose),
  });
  console.log("FOUND", !!doc);
  if (!doc) {
    process.exit(1);
  }
  console.log(JSON.stringify(doc, null, 2));

  const target = doc.otpHash || doc.codeHash || doc.codehash || doc.otpHash;
  for (let i = 0; i < 1000000; i += 1) {
    const code = String(i).padStart(6, "0");
    if (hashOtp(email, purpose, code) === target) {
      console.log("OTP", code);
      await mongoose.disconnect();
      process.exit(0);
    }
    if (i % 100000 === 0) process.stdout.write(".");
  }
  console.error("\nNOT FOUND");
  await mongoose.disconnect();
  process.exit(2);
})();
