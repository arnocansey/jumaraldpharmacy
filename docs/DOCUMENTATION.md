# Jumarald Pharmacy & Wellness — Comprehensive Technical & Operational Documentation

**Version:** 3.0.0 (Production Ready)  
**Superintendent Pharmacist:** Pharm. Philip Bruce-Tagoe (GPHC Reg. No. 2050984)  
**Compliance Standard:** Ghana Food & Drugs Authority (FDA), Pharmacy Council Ghana, Data Protection Act 2012 (Act 843)

---

## 1. Executive Summary

**Jumarald Pharmacy & Wellness** is a premier digital health and pharmaceutical web application designed for Greater Accra and nationwide Ghana. The platform integrates e-commerce medicine ordering, prescription submission and verification workflows, telehealth doctor consultations, multi-branch inventory tracking, and an intelligent **Superintendent Clinical AI Assistant ("Dr. Jumarald AI")**.

The platform is engineered with modern web standards, prioritizing high visual aesthetics, strict data confidentiality, transaction integrity, automated safety fallbacks, and compliance with Ghanaian healthcare regulations.

---

## 2. System Architecture & Tech Stack

The solution is architected as a high-performance monorepo workspace:

| Layer | Technology / Tooling | Description |
| :--- | :--- | :--- |
| **Frontend Storefront** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion | Patient portal, medicine catalog, review submission, AI chat widget, telehealth booking |
| **Admin Console** | Next.js 15, React 19, TypeScript, Recharts, Lucide Icons | Pharmacy operational dashboard, order fulfillment, inventory management, review verification |
| **Backend API** | Express.js 4, Node.js (v18+), TypeScript, Socket.io | REST API, WebSockets real-time updates, AI orchestrator, Paystack payment webhooks |
| **Database & ORM** | Neon PostgreSQL (Serverless), Prisma ORM 5 | Relational data persistence, schema migrations, ACID transaction guarantees |
| **AI Triage Engine** | OpenAI GPT-4o-mini / Gemini 1.5 Flash + Fallback Engine | Multi-tool orchestrator, RAG knowledge search, interaction analysis, prescription decoding |
| **Storage & Media** | Cloudinary Cloud CDN / In-Memory Buffer | Encrypted prescription uploads, product image assets |
| **Security & Auth** | JWT Access Tokens, bcrypt, Zod, Helmet, Rate Limiter | Role-Based Access Control (RBAC), API rate limiting, CORS restriction |

---

## 3. Core Subsystems & Capabilities

### 3.1 Superintendent AI Assistant ("Dr. Jumarald AI")
* **Orchestration Layer (`AIOrchestrator`)**: Classifies patient intent into distinct operational states (`PRODUCT_SEARCH`, `DRUG_INTERACTION`, `PRESCRIPTION_ANALYSIS`, `BRANCH_INQUIRY`, `SYMPTOM_TRIAGE`, `GENERAL_CONSULTATION`).
* **Tool Execution Registry**:
  * `searchProducts`: Multi-keyword search across master catalog returning live pricing in GH₵ and stock availability.
  * `getProductDetails`: Detailed dosage, active ingredients, and indications.
  * `checkDrugInteraction`: Multi-medication pharmacological safety contraindication analysis.
  * `findNearbyBranches`: Operating hours, contact numbers, and pickup location details.
  * `getUserOrders`: Authenticated patient order status tracking.
  * `createPharmacistConsultation`: Escalates high-risk cases directly to the human Superintendent Pharmacist queue (`AIEscalation`).
* **Rule-Based Fallback Engine (`fallbackClinicalEngine`)**: Ensures zero downtime if AI model APIs experience latency or rate limiting. Automatically flags emergency symptoms (chest pain, dyspnea) with immediate Ghana emergency warnings (112 / 193).

### 3.2 Review & Rating Verification System
* **Auto-Verification Flow**: Authenticated patient reviews auto-verify upon submission, recalculating the target product's average rating score and review count in real time.
* **Interactive UI**: Modal interface on product detail pages (`/shop/[slug]`) allowing patients to submit star ratings and detailed feedback.

### 3.3 Inventory & Multi-Branch Management
* **Global Product Catalog vs Branch Inventories**: Resolved global reporting by querying the master `Product` database when no specific branch filter is selected, preventing 0-count KPI errors.
* **Audit Logging**: All stock adjustments, branch transfers, bulk updates, and review approvals are recorded in the `AuditLog` table with timestamped user attribution.

---

## 4. Security & Compliance Architecture (CIA Triad)

### 4.1 Confidentiality
* **Authentication & RBAC**: Session security via JWT tokens. Access to sensitive routes (`/api/v1/admin/*`, `/api/v1/inventory/*`) restricted by `requireRole([SUPER_ADMIN, ADMIN, PHARMACIST])`.
* **Database User Verification**: `authenticateToken` validates `isActive` user status directly against PostgreSQL, revoking access immediately upon account deactivation.
* **Prescription Privacy**: Encrypted uploads and secure memory buffers prevent unauthorized file exposure.

### 4.2 Integrity
* **ACID Transactions**: Financial operations and inventory decrements use `prisma.$transaction`.
* **Paystack Webhook Verification**: HMAC SHA-512 signature validation ensures incoming payment events originate from Paystack servers.
* **Strict Input Validation**: All incoming requests sanitized using `Zod` schemas.

### 4.3 Availability & Resilience
* **Rate Limiting Protection**: Dedicated rate limiters applied across sensitive endpoints:
  * `authLimiter`: 20 attempts / 15 minutes
  * `aiLimiter`: 20 requests / minute
  * `prescriptionLimiter`: 30 requests / 15 minutes
  * `apiLimiter`: 120 requests / minute
* **Strict CORS Whitelisting**: Restricted explicitly to Jumarald production domains (`jumarald*.vercel.app`, `jumaraldpharmacy.com`).

---

## 5. Regulatory & Legal Policies

The application incorporates dedicated compliance pages accessible via the global site footer and checkout flow:

1. **Acceptable Use Policy (`/acceptable-use`)**: Covers prescription fraud prevention, AI interaction rules, prohibited scraping, and account revocation rules.
2. **Terms of Service (`/terms`)**: Details Prescription-Only Medicine (POM) verification protocols, cold-chain transport regulations, non-returnable drug rules, and emergency medical disclaimers.
3. **Privacy Policy (`/privacy`)**: Details patient rights and data protection standards under the **Ghana Data Protection Act 2012 (Act 843)**.

---

## 6. Deployment & Maintenance

### Environment Variables (.env)
```env
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://user:password@ep-neon-db.neon.tech/jumarald
JWT_SECRET=your_secure_jwt_secret_key
ALLOWED_ORIGINS=https://jumaraldpharmacy.com,https://jumaraldpharmacy.vercel.app
OPENAI_API_KEY=sk-proj-...
GEMINI_API_KEY=AIzaSy...
PAYSTACK_SECRET_KEY=sk_live_...
CLOUDINARY_CLOUD_NAME=jumarald
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Build & Migration Commands
```bash
# Install dependencies
pnpm install

# Push Prisma Database Schema & Seed Data
cd backend
pnpm prisma:db-push
pnpm prisma:seed

# Production Build
pnpm build
```

---
© 2026 Jumarald Pharmacy & Wellness Ltd. All rights reserved.
