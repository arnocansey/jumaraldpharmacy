# Deployment Guide

All code is pushed. Follow these steps to deploy.

---

## 1. Deploy Admin (Vercel)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the GitHub repo: `arnocansey/jumaraldpharmacy`
3. **Project name:** `jumaraldpharmacyadmin`
4. **Root Directory:** `admin`
5. **Framework Preset:** Next.js (auto-detected)
6. **Install Command:** `npm install`
7. **Build Command:** `npm run build`
8. Click **Deploy**

### Set Environment Variables in Vercel (Admin):
| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://YOUR-BACKEND-URL.onrender.com/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | `https://jumaraldpharmacyadmin.vercel.app` |

---

## 2. Deploy Backend (Render)

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect GitHub repo: `arnocansey/jumaraldpharmacy`
4. **Name:** `jumaraldpharmacy-backend`
5. **Root Directory:** `backend`
6. **Runtime:** Node
7. **Build Command:** `npm install && npx prisma generate && npx tsc`
8. **Start Command:** `node dist/server.js`
9. Click **Create Web Service**

### Set Environment Variables in Render:
| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `DATABASE_URL` | (your Neon connection string) |
| `DIRECT_URL` | (your Neon direct connection string) |
| `JWT_SECRET` | (generate a random 64-char string) |
| `ALLOWED_ORIGINS` | `https://jumaraldpharmacy.vercel.app,https://jumaraldpharmacyadmin.vercel.app` |
| `SMTP_HOST` | (your SMTP host) |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | (your SMTP user) |
| `SMTP_PASS` | (your SMTP password) |
| `SMTP_FROM` | `noreply@jumaraldpharmacy.com` |
| `ADMIN_URL` | `https://jumaraldpharmacyadmin.vercel.app` |
| `FRONTEND_URL` | `https://jumaraldpharmacy.vercel.app` |

---

## 3. Set Frontend Env Vars (Vercel)

Update the existing `jumaraldpharmacy` project:
| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://YOUR-BACKEND-URL.onrender.com/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | `https://jumaraldpharmacy.vercel.app` |

---

## 4. Production Database Setup

Run against your production Neon database:

```bash
# Push schema
npx prisma db push

# Seed branches, interactions, FAQs, testimonials
npx ts-node prisma/seed-enterprise.ts

# Seed categories
npx ts-node prisma/seed-categories.ts

# Seed blog posts
npx ts-node prisma/seed-blog.ts
```

---

## 5. Verify

- [ ] Frontend: `https://jumaraldpharmacy.vercel.app` — all pages load
- [ ] Admin: `https://jumaraldpharmacyadmin.vercel.app` — login works
- [ ] Backend: `https://YOUR-BACKEND-URL.onrender.com/api/v1/health` — returns `{"status":"ok"}`
- [ ] API calls work from admin → backend
- [ ] Place a test order end-to-end
