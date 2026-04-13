require("dotenv").config();
const mongoose = require("mongoose");

const DB = process.env.MONGO_URI || process.env.DBSTRING;
const email = "test+copilot20260413@mailinator.com";
const purpose = "registration";

(async () => {
  await mongoose.connect(DB, { dbName: "test" });
  const coll = mongoose.connection.collection("otptokens");
  const doc = await coll.findOne({ email, purpose });
  console.log("DOC", JSON.stringify(doc, null, 2));
  await mongoose.disconnect();
})();
