# Email Microservice (Render Ready)

## What this service provides

- Health check: `GET /api/health`
- OTP request: `POST /api/otp/request`
- OTP verify: `POST /api/otp/verify`

## Render deployment settings

- Service type: `Web Service`
- Root directory: `backend/emailmicroservice`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/api/health`

## Required environment variables on Render

- `CORS_ORIGIN` (frontend URL, comma-separated if multiple)

## Optional environment variables

- `SMTP_HOST` (default: `smtp.gmail.com`)
- `SMTP_PORT` (default: `587`)
- `EMAIL_SERVICE_PORT` (Render usually injects `PORT` automatically)
- `BRIMEE_API_KEY` (recommended for service-to-service auth)
- `OTP_TTL_MINUTES` (default: `10`)
- `OTP_MAX_ATTEMPTS` (default: `6`)
