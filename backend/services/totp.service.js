const crypto = require('crypto');
const QRCode = require('qrcode');

const TOTP_DIGITS = 6;
const TOTP_PERIOD_SECONDS = Math.max(15, Number(process.env.TOTP_PERIOD_SECONDS || 30));
const TOTP_WINDOW = Math.max(0, Number(process.env.TOTP_WINDOW || 1));
const TOTP_ISSUER = String(process.env.TOTP_ISSUER || 'DevPortix').trim() || 'DevPortix';

const getEncryptionKey = () =>
  crypto
    .createHash('sha256')
    .update(
      String(
        process.env.TOTP_ENCRYPTION_SECRET ||
          process.env.JWT_SECRET ||
          process.env.JWTSECRET ||
          'devportix_totp_secret',
      ),
    )
    .digest();

const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const encodeBase32 = (buffer) => {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += base32Alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += base32Alphabet[(value << (5 - bits)) & 31];
  }

  return output;
};

const decodeBase32 = (input) => {
  const normalized = String(input || '')
    .toUpperCase()
    .replace(/=+$/g, '')
    .replace(/[^A-Z2-7]/g, '');

  let bits = 0;
  let value = 0;
  const bytes = [];

  for (const char of normalized) {
    const index = base32Alphabet.indexOf(char);
    if (index === -1) {
      continue;
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
};

const encryptSecret = (secret) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const cipherText = Buffer.concat([cipher.update(String(secret), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    cipherText: cipherText.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
};

const decryptSecret = (payload) => {
  if (!payload?.cipherText || !payload?.iv || !payload?.authTag) {
    return '';
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    Buffer.from(payload.iv, 'hex'),
  );
  decipher.setAuthTag(Buffer.from(payload.authTag, 'hex'));
  const plainText = Buffer.concat([
    decipher.update(Buffer.from(payload.cipherText, 'hex')),
    decipher.final(),
  ]);

  return plainText.toString('utf8');
};

const generateSecret = () => encodeBase32(crypto.randomBytes(20));

const buildCounterBuffer = (counter) => {
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buffer.writeUInt32BE(counter >>> 0, 4);
  return buffer;
};

const generateTokenForCounter = (secret, counter) => {
  const key = decodeBase32(secret);
  const hmac = crypto
    .createHmac('sha1', key)
    .update(buildCounterBuffer(counter))
    .digest();
  const offset = hmac[hmac.length - 1] & 15;
  const binary =
    ((hmac[offset] & 127) << 24) |
    ((hmac[offset + 1] & 255) << 16) |
    ((hmac[offset + 2] & 255) << 8) |
    (hmac[offset + 3] & 255);

  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0');
};

const generateCurrentToken = (secret, timestamp = Date.now()) => {
  const counter = Math.floor(timestamp / 1000 / TOTP_PERIOD_SECONDS);
  return generateTokenForCounter(secret, counter);
};

const verifyToken = (secret, token, timestamp = Date.now()) => {
  const normalizedToken = String(token || '').trim();
  if (!/^\d{6}$/.test(normalizedToken)) {
    return false;
  }

  const counter = Math.floor(timestamp / 1000 / TOTP_PERIOD_SECONDS);
  for (let offset = -TOTP_WINDOW; offset <= TOTP_WINDOW; offset += 1) {
    if (generateTokenForCounter(secret, counter + offset) === normalizedToken) {
      return true;
    }
  }

  return false;
};

const buildOtpAuthUrl = ({ email, secret }) => {
  const label = `${TOTP_ISSUER}:${String(email || '').trim().toLowerCase()}`;
  const params = new URLSearchParams({
    secret,
    issuer: TOTP_ISSUER,
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD_SECONDS),
  });

  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
};

const buildSetupPayload = async ({ email, secret }) => {
  const otpauthUrl = buildOtpAuthUrl({ email, secret });
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 240,
  });

  return {
    manualEntryKey: secret,
    otpauthUrl,
    qrCodeDataUrl,
    issuer: TOTP_ISSUER,
    periodSeconds: TOTP_PERIOD_SECONDS,
    expiresInMinutes: 5,
  };
};

module.exports = {
  TOTP_DIGITS,
  TOTP_ISSUER,
  TOTP_PERIOD_SECONDS,
  buildSetupPayload,
  decryptSecret,
  encryptSecret,
  generateCurrentToken,
  generateSecret,
  verifyToken,
};
