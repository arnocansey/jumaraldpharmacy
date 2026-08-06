# Jumarald Pharmacy

A full-stack pharmacy management system built with Next.js 15, Express.js, Prisma ORM, and PostgreSQL.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Admin | Next.js 15, React 19, TypeScript, Tailwind CSS, Recharts |
| Backend | Express.js 4, TypeScript, Prisma ORM 5, PostgreSQL |
| Auth | JWT (access tokens), role-based access control |
| Package Manager | pnpm (monorepo workspaces) |

## Project Structure

```
jumaraldpharmacy/
├── frontend/          # Customer-facing storefront (port 3000)
├── admin/             # Admin control panel (port 3001)
├── backend/           # Express API server (port 5000)
│   ├── prisma/        # Database schema and migrations
│   ├── src/
│   │   ├── config/    # Environment configuration
│   │   ├── controllers/ # Route handlers
│   │   ├── lib/       # Prisma client singleton
│   │   ├── middleware/ # Auth, role-based access
│   │   └── routes/    # API route definitions
│   └── package.json
├── .env.example
├── render.yaml        # Render deployment config
└── package.json       # Root workspace scripts
```

## Getting Started (Development)

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL database (or Neon)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example backend/.env
cp .env.example frontend/.env.local
cp .env.example admin/.env.local
```

Edit `backend/.env` with your database credentials and a secure `JWT_SECRET`.

### 3. Set Up Database

```bash
cd backend
pnpm prisma:db-push
pnpm prisma:seed
pnpm prisma:seed-categories
pnpm prisma:seed-blog
```

### 4. Start Development Servers

```bash
# From root - starts all three
pnpm dev:backend
pnpm dev:frontend
pnpm dev:admin
```

### 5. Access the Apps

- **Frontend**: http://localhost:3000
- **Admin Panel**: http://localhost:3001
- **API**: http://localhost:5000/api/health

## Deployment

### Backend (Render)

1. Push code to GitHub
2. Go to [Render](https://render.com) and create a new **Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate && npx tsc`
   - **Start Command**: `node dist/server.js`
5. Add environment variables:
   ```
   NODE_ENV=production
   DATABASE_URL=your_neon_postgresql_url
   JWT_SECRET=your_secure_random_string
   ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://your-admin.vercel.app
   FRONTEND_URL=https://your-frontend.vercel.app
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   PAYSTACK_SECRET_KEY=sk_live_your_key
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=Jumarald Pharmacy <noreply@jumaraldpharmacy.com>
   ```
6. Deploy

### Frontend (Vercel)

1. Go to [Vercel](https://vercel.com) and create a new project
2. Import your GitHub repo
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `cd ../.. && pnpm install --frozen-lockfile && cd frontend && pnpm build`
   - **Install Command**: `cd ../.. && pnpm install --frozen-lockfile`
4. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api/v1
   ```
5. Deploy

### Admin (Vercel)

1. Create another Vercel project for admin
2. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `admin`
   - **Build Command**: `cd ../.. && pnpm install --frozen-lockfile && cd admin && pnpm build`
   - **Install Command**: `cd ../.. && pnpm install --frozen-lockfile`
3. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api/v1
   ```
4. Deploy

### After Deployment

1. Update `ALLOWED_ORIGINS` in Render with your Vercel URLs
2. Run database migrations:
   ```bash
   # Connect to your database and run
   npx prisma db push
   npx prisma db seed
   ```
3. Test all endpoints at `https://your-backend.onrender.com/api/health`

## API Endpoints

### Auth
- `POST /api/v1/auth/register` - Register new customer account
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user (requires token)

### Products
- `GET /api/v1/products` - List products (search, filter, pagination)
- `GET /api/v1/products/categories` - List categories
- `GET /api/v1/products/brands` - List brands
- `GET /api/v1/products/:slug` - Get product by slug
- `POST /api/v1/products` - Create product (admin/pharmacist)
- `PATCH /api/v1/products/:id` - Update product (admin/pharmacist)
- `DELETE /api/v1/products/:id` - Delete product (admin/pharmacist)

### Orders
- `POST /api/v1/orders` - Create order (auth required)
- `GET /api/v1/orders/my` - Get my orders (auth required)
- `GET /api/v1/orders/all` - Get all orders (admin)
- `PATCH /api/v1/orders/:id/status` - Update order status (admin)

### Prescriptions
- `POST /api/v1/prescriptions` - Submit prescription (auth required)
- `GET /api/v1/prescriptions/my` - Get my prescriptions (auth required)
- `GET /api/v1/prescriptions/queue` - Get prescription queue (pharmacist/admin)
- `PATCH /api/v1/prescriptions/:id/verify` - Verify prescription (pharmacist/admin)

### Blog
- `GET /api/v1/blog` - List blog posts (search, filter by tag)
- `GET /api/v1/blog/:slug` - Get blog post by slug
- `POST /api/v1/blog` - Create blog post (admin/pharmacist)
- `POST /api/v1/blog/:id/comments` - Add comment (auth required)

### Consultations
- `GET /api/v1/consultations/doctors` - List doctors
- `POST /api/v1/consultations/book` - Book consultation (auth required)
- `GET /api/v1/consultations/my` - Get my consultations (auth required)

### Analytics
- `GET /api/v1/analytics/overview` - Dashboard analytics (admin)

## Roles

- `SUPER_ADMIN` - Full system access
- `ADMIN` - Administrative access
- `PHARMACIST` - Product and prescription management
- `DOCTOR` - Telehealth consultations
- `PATIENT` / `CUSTOMER` - Customer storefront access

## Scripts

```bash
# Root
pnpm dev:frontend    # Start frontend dev server
pnpm dev:backend     # Start backend dev server
pnpm dev:admin       # Start admin dev server
pnpm build           # Build all packages
pnpm lint            # Lint all packages
pnpm format          # Format code with Prettier

# Backend
pnpm prisma:generate # Generate Prisma client
pnpm prisma:db-push  # Push schema to database
pnpm prisma:seed     # Seed database
pnpm prisma:seed-categories  # Seed clean categories
pnpm prisma:seed-blog        # Seed blog posts
```
