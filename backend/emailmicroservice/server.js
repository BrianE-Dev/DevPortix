const path = require("path");
const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const DBconnect = require("./database/dbConnect");
const { emailRouter } = require("./controller/email.router");

const app = express();
app.set("etag", false);

const PORT = Number(process.env.PORT || process.env.EMAIL_SERVICE_PORT) || 8000;
const BRIMEE_API_KEY = String(process.env.BRIMEE_API_KEY || "").trim();
const normalizeOrigin = (value) =>
  String(value || "")
    .trim()
    .replace(/\/+$/, "");
const allowedOrigins = String(
  process.env.CORS_ORIGIN || process.env.CLIENT_URL || "",
)
  .split(",")
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    const normalized = normalizeOrigin(origin);
    if (
      !origin ||
      allowedOrigins.length === 0 ||
      allowedOrigins.includes(normalized)
    ) {
      callback(null, true);
      return;
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-service-api-key"],
};

app.use(cors(corsOptions));
app.options("/{*any}", cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", (req, res, next) => {
  if (!BRIMEE_API_KEY) {
    return next();
  }

  if (req.get("x-service-api-key") !== BRIMEE_API_KEY) {
    return res
      .status(401)
      .json({ message: "Unauthorized OTP service request" });
  }

  return next();
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "email-service" });
});

app.use("/api", emailRouter);

const start = async () => {
  await DBconnect();
  app.listen(PORT, () => {
    console.log(`[email-service] Server running on port ${PORT}`);
  });
};

start().catch((error) => {
  console.error("[email-service] Failed to start:", error.message);
  process.exit(1);
});
