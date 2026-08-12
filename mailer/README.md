# Jumarald Mailer Microservice (Vercel)

A lightweight, serverless transactional email relay built for **Jumarald Pharmacy** to bypass Render's outbound SMTP port blocking.

---

## 🚀 Vercel Deployment Instructions

1. **Deploy to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/new).
   - Import the `arnocansey/jumaraldpharmacy` repository.
   - Set **Root Directory** to `mailer`.
   - Click **Deploy**.

2. **Configure Environment Variables on Vercel**:
   In your Vercel Project Settings -> **Environment Variables**, add:

   | Variable Name | Value Example | Description |
   |---|---|---|
   | `MAILER_API_KEY` | `jumarald_secret_mailer_key_2026` | Secret key used to authorize backend requests |
   | `SMTP_HOST` | `smtp.gmail.com` | Your SMTP server host |
   | `SMTP_PORT` | `587` | SMTP port (587 or 465) |
   | `SMTP_USER` | `info@jumaraldpharmacy.com` | SMTP username |
   | `SMTP_PASS` | `xxxx xxxx xxxx xxxx` | SMTP password / App Password |
   | `SMTP_FROM` | `"Jumarald Pharmacy" <info@jumaraldpharmacy.com>` | Sender display name & email |

---

## 🔗 Render Backend Environment Setup

In your Render backend dashboard -> **Environment**, add:

| Variable Name | Value Example |
|---|---|
| `MAILER_SERVICE_URL` | `https://your-mailer-app.vercel.app/api/send-email` |
| `MAILER_API_KEY` | `jumarald_secret_mailer_key_2026` |

---

## 🧪 Testing the API Endpoint

### Health Check (GET)
```bash
curl https://your-mailer-app.vercel.app/api/send-email
```

### Send Email Request (POST)
```bash
curl -X POST https://your-mailer-app.vercel.app/api/send-email \
  -H "Content-Type: application/json" \
  -H "x-api-key: jumarald_secret_mailer_key_2026" \
  -d '{
    "to": "patient@example.com",
    "subject": "Prescription Approved",
    "html": "<h1>Your Prescription is Approved</h1>"
  }'
```
