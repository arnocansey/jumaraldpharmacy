# Jumarald Pharmacy & Wellness — Comprehensive Technical & Operational Documentation

**Version:** 3.0.0 (Production Ready)  
**Superintendent Pharmacist:** Pharm. Philip Bruce-Tagoe (GPHC Reg. No. 2050984)  
**Compliance Standard:** Ghana Food & Drugs Authority (FDA), Pharmacy Council Ghana, Data Protection Act 2012 (Act 843)

---

## 1. Executive Summary

**Jumarald Pharmacy & Wellness** is a premier digital health and pharmaceutical enterprise application designed for Greater Accra and nationwide Ghana. The platform integrates e-commerce medicine ordering, prescription submission and verification workflows, telehealth doctor consultations, multi-branch inventory tracking, and an intelligent **Superintendent Clinical AI Assistant ("Dr. Jumarald AI")**.

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

## 3. Superintendent AI Assistant Architecture ("Dr. Jumarald AI")

The **Dr. Jumarald AI** subsystem functions as a virtual clinical pharmacy assistant operating under the core guiding principle: *"AI assists. Licensed Pharmacists decide."*

### 3.1 Dual-Provider Orchestration Engine
* **Provider Factory (`getAIProvider`)**: Dynamically selects between **OpenAI GPT-4o-mini** and **Google Gemini 1.5 Flash** based on configured API keys, providing automatic failover.
* **Intent Classification Pipeline (`AIOrchestrator`)**:
  1. `PRODUCT_SEARCH`: Multi-keyword search across master catalog with live pricing in GH₵ and stock validation.
  2. `DRUG_INTERACTION`: Pharmacological contraindication analysis across active ingredients.
  3. `PRESCRIPTION_ANALYSIS`: Decodes prescription shorthand (`TDS`, `BD`, `PRN`), dosage, frequency, and precautions.
  4. `BRANCH_INQUIRY`: Returns operating hours, contact numbers, and branch pickup availability.
  5. `SYMPTOM_TRIAGE`: Evaluates severity (`LOW`, `MODERATE`, `HIGH`, `URGENT`) and suggests doctor consultation.
  6. `GENERAL_CONSULTATION`: Plain-text empathetic clinical guidance sanitized of raw markdown headers (`##`/`###`).

### 3.2 Tool Execution Registry (`tool-registry.ts`)
* `searchProducts`: Multi-keyword catalog query returning live prices in GH₵ and availability.
* `getProductDetails`: Retrieves active ingredients, dosage guidance, and therapeutic indications.
* `checkDrugInteraction`: Multi-medication pharmacological contraindication analysis.
* `findNearbyBranches`: Returns branch physical addresses, phone numbers, and operating hours.
* `getUserOrders`: Authenticated patient order status tracking.
* `createPharmacistConsultation`: Escalates high-risk cases directly to the Superintendent Pharmacist queue (`AIEscalation`).

### 3.3 High-Reliability Clinical Fallback Engine (`fallbackClinicalEngine`)
* Zero-downtime protection ensuring that if third-party AI APIs experience latency or rate-limiting, the system automatically switches to an internal rule-based triage engine.
* Flags emergency symptoms (chest pain, acute shortness of breath) with immediate Ghana emergency warnings (**112 / 193**).

---

## 4. Comprehensive Security & CIA Triad Audit

### 4.1 Confidentiality Audit
* **Role-Based Access Control (RBAC)**: Enforced via `requireRole` middleware across sensitive routes (`SUPER_ADMIN`, `ADMIN`, `PHARMACIST`, `DOCTOR`, `PATIENT`).
* **Active User Database Verification**: `authenticateToken` middleware queries `prisma.user` on every request. Deactivated accounts return `403 Account disabled or session revoked`, invalidating active JWTs instantly.
* **Password Encryption**: Hashed using `bcrypt` (10-12 salt rounds). Raw passwords are never persisted or logged.
* **Prescription Data Privacy**: Prescriptions uploaded via memory buffers and encrypted Cloudinary streams with randomized public IDs.

### 4.2 Integrity Audit
* **ACID Transactions**: Multi-step inventory adjustments, order fulfillment, and loyalty point redemptions use `prisma.$transaction`.
* **Paystack HMAC SHA-512 Verification**: Paystack webhooks validate `x-paystack-signature` using HMAC SHA-512 before updating order statuses to `PAID`.
* **Strict Input Validation**: Endpoints process incoming data strictly validated against Zod schemas.
* **Audit Trail**: Administrative actions (stock transfers, bulk product edits, review approvals) recorded in the `AuditLog` table with user attribution and timestamps.

### 4.3 Availability Audit
* **Resource Rate Limiting**:
  * `authLimiter`: 20 login/register attempts per 15 minutes
  * `aiLimiter`: 20 requests per minute
  * `prescriptionLimiter`: 30 uploads per 15 minutes
  * `apiLimiter`: 120 general requests per minute
* **Strict Domain CORS**: Allowed origins restricted to Jumarald production subdomains (`jumarald*.vercel.app`, `jumaraldpharmacy.com`).
* **WebSocket Real-time Updates**: Real-time inventory sync and order status updates via Socket.io with auto-reconnection (`useSocketAutoInvalidate`).

---

## 5. Integrated External APIs & Services

| Provider / API | Purpose / Integration Point | Auth / Protocol |
| :--- | :--- | :--- |
| **Paystack Payment API** | Ghana Mobile Money (MTN MoMo, Telecel Cash, AT Money) & Card checkout in GH₵ | Bearer API Key & Webhook HMAC SHA-512 |
| **OpenAI API (GPT-4o-mini)** | Primary LLM engine for structured JSON tool execution & interaction analysis | Bearer API Key (`OPENAI_API_KEY`) |
| **Google Gemini API (1.5 Flash)** | Secondary LLM engine for clinical consultation & RAG knowledge search | API Key (`GEMINI_API_KEY`) |
| **Cloudinary Cloud CDN** | Encrypted prescription upload storage & product image optimization CDN | Cloud API Secret & Signed SDK Streams |
| **Nodemailer / SMTP API** | Transactional emails for order receipts, prescription verification, & password resets | TLS/SSL Authenticated SMTP |
| **WebPush API / VAPID Keys** | Real-time browser push notifications for rider tracking & restocking alerts | VAPID Key Pair Protocol |
| **Sentry Telemetry API** | Backend exception logging, performance monitoring, & error tracing | Sentry DSN & Node SDK |

---

## 6. Strategic Future Upgrades & Planned Purchases

1. **Twilio / Hubtel SMS Gateway API (Paid Enterprise Service)**: Direct SMS notifications for Ghanaian mobile numbers (instant OTP login codes, prescription status alerts, rider ETA updates).
2. **Upstash Redis / Dedicated Redis Cluster (Paid Subscription)**: Distributed in-memory session caching, high-performance rate limiting, and real-time Socket.io pub/sub state synchronization.
3. **AWS S3 / Cloudflare R2 Encrypted Health Vault (Paid Cloud Storage)**: Long-term HIPAA and Ghana Data Protection Act (Act 843) compliant encrypted prescription archiving.
4. **RxNorm / NLM Clinical Drug Interaction API (Enterprise License)**: Integration with international standardized pharmaceutical registries for automated contraindication scanning.
5. **IdentityPass / Ghana Card National ID Verification API (Paid Service)**: Automated identity validation for patient onboarding and doctor medical license validation.
6. **Google Maps Platform API (Paid Geocoding & Route Optimization)**: Exact delivery distance calculation, rider geolocation tracking, and dynamic delivery fee computation.

---

## 7. Regulatory & Legal Policies

1. **Acceptable Use Policy (`/acceptable-use`)**: Covers prescription fraud prevention, AI interaction rules, prohibited scraping, and account revocation rules.
2. **Terms of Service (`/terms`)**: Details Prescription-Only Medicine (POM) verification protocols, cold-chain transport regulations, non-returnable drug rules, and emergency medical disclaimers.
3. **Privacy Policy (`/privacy`)**: Details patient rights and data protection standards under the **Ghana Data Protection Act 2012 (Act 843)**.

---

## 8. Deployment & Maintenance

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
