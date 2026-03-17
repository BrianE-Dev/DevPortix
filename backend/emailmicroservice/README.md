# Email Microservice (Render Ready)

## What this service provides
- Health check: `GET /api/health`
- OTP endpoints have been removed.

## Render deployment settings
- Service type: `Web Service`
- Root directory: `backend/emailmicroservice`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/api/health`

## Required environment variables on Render
- `EMAIL` and `EMAILSECRET` (or `MAIL_USER` and `MAIL_PASS`)
- `CORS_ORIGIN` (frontend URL, comma-separated if multiple)

## Optional environment variables
- `SMTP_HOST` (default: `smtp.gmail.com`)
- `SMTP_PORT` (default: `587`)
- `EMAIL_SERVICE_PORT` (Render usually injects `PORT` automatically)
