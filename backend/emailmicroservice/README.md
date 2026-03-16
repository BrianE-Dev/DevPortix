# Email Microservice (Render Ready)

## What this service provides
- `POST /api/v1/mailer/send-otp`
- `POST /api/v1/mailer/verify-otp`
- Health check: `GET /api/health`
- OTP purpose is restricted to `registration` only.

## Render deployment settings
- Service type: `Web Service`
- Root directory: `backend/emailmicroservice`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/api/health`

## Required environment variables on Render
- `EMAIL` and `EMAILSECRET` (or `MAIL_USER` and `MAIL_PASS`)
- `JWT_SECRET` (or `JWTSECRET`)
- `CORS_ORIGIN` (frontend URL, comma-separated if multiple)
- `MONGO_URI` or `DBSTRING` (required for persistent OTP storage)

## Optional environment variables
- `SMTP_HOST` (default: `smtp.gmail.com`)
- `SMTP_PORT` (default: `587`)
- `OTP_EXPIRY_MS` (default: `600000`)
- `OTP_MAX_ATTEMPTS` (default: `3`)
- `OTP_RESEND_COOLDOWN_MS` (default: `45000`)
- `EMAIL_SERVICE_PORT` (Render usually injects `PORT` automatically)
