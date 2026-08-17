import os
import sys
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

os.makedirs("docs", exist_ok=True)

# ---------------------------------------------------------------------------
# 1. MARKDOWN DOCUMENTATION GENERATION
# ---------------------------------------------------------------------------
md_content = """# Jumarald Pharmacy & Wellness — Comprehensive Technical & Operational Documentation

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
"""

with open("docs/DOCUMENTATION.md", "w", encoding="utf-8") as f:
    f.write(md_content)

print("Generated docs/DOCUMENTATION.md successfully.")


# ---------------------------------------------------------------------------
# 2. MICROSOFT WORD DOCUMENT (.DOCX) GENERATION
# ---------------------------------------------------------------------------
def create_docx():
    doc = Document()
    
    # Page setup - 1 inch margins
    sections = doc.sections
    for s in sections:
        s.top_margin = Inches(1)
        s.bottom_margin = Inches(1)
        s.left_margin = Inches(1)
        s.right_margin = Inches(1)

    # Styling Palette
    EMERALD = RGBColor(16, 185, 129)
    DARK_SLATE = RGBColor(15, 23, 42)
    GRAY = RGBColor(71, 85, 105)

    # Styles
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Calibri'
    style_normal.font.size = Pt(11)
    style_normal.font.color.rgb = DARK_SLATE

    # Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_title = p_title.add_run("Jumarald Pharmacy & Wellness")
    run_title.font.name = 'Calibri'
    run_title.font.size = Pt(26)
    run_title.font.bold = True
    run_title.font.color.rgb = EMERALD

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_sub = p_sub.add_run("Full Technical Architecture, Security & Operational Documentation\nVersion 3.0.0")
    run_sub.font.size = Pt(13)
    run_sub.font.italic = True
    run_sub.font.color.rgb = GRAY

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    def add_heading_1(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(18)
        h.paragraph_format.space_after = Pt(6)
        r = h.add_run(text)
        r.font.size = Pt(16)
        r.font.bold = True
        r.font.color.rgb = EMERALD
        return h

    def add_heading_2(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(12)
        h.paragraph_format.space_after = Pt(4)
        r = h.add_run(text)
        r.font.size = Pt(13)
        r.font.bold = True
        r.font.color.rgb = DARK_SLATE
        return h

    # Section 1
    add_heading_1("1. Executive Summary")
    doc.add_paragraph(
        "Jumarald Pharmacy & Wellness is a full-stack digital health and pharmaceutical enterprise application operating in Ghana. "
        "The platform unifies e-commerce medicine retail, prescription validation, telehealth physician appointments, real-time multi-branch inventory tracking, "
        "and an AI-powered Superintendent Clinical Assistant ('Dr. Jumarald AI')."
    )
    doc.add_paragraph(
        "The solution is compliant with Ghana Food & Drugs Authority (FDA) standards, Pharmacy Council regulations, and the Data Protection Act 2012 (Act 843). "
        "Superintendent Pharmacist: Pharm. Philip Bruce-Tagoe (GPHC Reg. No. 2050984)."
    )

    # Section 2
    add_heading_1("2. System Architecture & Monorepo Structure")
    doc.add_paragraph("The application is built using a monorepo workspace architecture:")

    table = doc.add_table(rows=1, cols=3)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    hdr_cells = table.rows[0].cells
    headers = ["Layer", "Technology Stack", "Key Responsibilities"]
    for i, h_text in enumerate(headers):
        hdr_cells[i].text = h_text
        shading = parse_xml(r'<w:shd {} w:fill="0F172A"/>'.format(nsdecls('w')))
        hdr_cells[i]._tc.get_or_add_tcPr().append(shading)
        p = hdr_cells[i].paragraphs[0]
        for r in p.runs:
            r.font.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)

    data = [
        ("Frontend Storefront", "Next.js 15, React 19, Tailwind CSS", "Patient portal, product catalog, review submission, AI chat widget"),
        ("Admin Console", "Next.js 15, Recharts, Lucide Icons", "Operational management, order processing, global inventory reports"),
        ("Backend API", "Express.js 4, TypeScript, Socket.io", "RESTful endpoints, real-time WebSocket events, payment webhooks"),
        ("Database & ORM", "Neon PostgreSQL (Serverless), Prisma ORM", "Relational persistence, schema safety, ACID transaction handling"),
        ("Clinical AI Engine", "OpenAI GPT-4o-mini / Gemini 1.5 Flash", "Autonomous intent classification, multi-tool execution, RAG knowledge"),
        ("Security & Auth", "JWT, bcrypt, Zod, Helmet, Rate Limiters", "Role-Based Access Control, request sanitization, anti-scraping"),
    ]

    for row_data in data:
        row_cells = table.add_row().cells
        for i, text in enumerate(row_data):
            row_cells[i].text = text

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Section 3
    add_heading_1("3. Superintendent AI Assistant Architecture")
    doc.add_paragraph(
        "The AI assistant ('Dr. Jumarald AI') acts as a virtual clinical pharmacy assistant. "
        "It features an autonomous Orchestrator, Tool Registry, and Rule-Based Fallback Engine:"
    )
    add_heading_2("3.1 Registered AI Tools")
    tools = [
        ("searchProducts", "Executes multi-keyword search across master catalog with live GH₵ prices and stock status."),
        ("getProductDetails", "Fetches active ingredients, dosage guidance, and therapeutic indications."),
        ("checkDrugInteraction", "Performs pharmacological contraindication analysis across multiple active medications."),
        ("findNearbyBranches", "Returns branch addresses, phone numbers, opening hours, and pickup options."),
        ("getUserOrders", "Retrieves patient order tracking status for authenticated accounts."),
        ("createPharmacistConsultation", "Escalates high-risk symptoms directly to the Superintendent Pharmacist queue."),
    ]
    for name, desc in tools:
        p = doc.add_paragraph(style='List Bullet')
        r_name = p.add_run(f"{name}: ")
        r_name.bold = True
        p.add_run(desc)

    # Section 4
    add_heading_1("4. Security & CIA Triad Audit")
    add_heading_2("4.1 Confidentiality")
    doc.add_paragraph("Stateless JWT access tokens with RBAC middleware (requireRole). Database active-user validation on every token request revokes access immediately upon account deactivation.")
    
    add_heading_2("4.2 Integrity")
    doc.add_paragraph("All stock operations and financial payments use Prisma ACID transactions. Paystack payments are verified via HMAC SHA-512 signatures. All incoming API payloads are validated using Zod schemas.")

    add_heading_2("4.3 Availability & Rate Limiting")
    doc.add_paragraph("Strict rate limiters protect system resources:")
    doc.add_paragraph("• authLimiter: 20 login/register attempts per 15 minutes\n• aiLimiter: 20 requests per minute\n• prescriptionLimiter: 30 uploads per 15 minutes\n• apiLimiter: 120 general requests per minute")

    # Section 5
    add_heading_1("5. Legal & Regulatory Compliance Suite")
    doc.add_paragraph("1. Acceptable Use Policy (/acceptable-use): Strict rules against prescription forgery, identity theft, and prompt-injection.")
    doc.add_paragraph("2. Terms of Service (/terms): FDA Ghana rules for prescription verification, cold-chain transport, and pharmaceutical returns.")
    doc.add_paragraph("3. Privacy Policy (/privacy): Data protection compliance under the Ghana Data Protection Act 2012 (Act 843).")

    doc.save("docs/JUMARALD_PHARMACY_DOCUMENTATION.docx")
    print("Generated docs/JUMARALD_PHARMACY_DOCUMENTATION.docx successfully.")

create_docx()


# ---------------------------------------------------------------------------
# 3. PDF DOCUMENT GENERATION (ReportLab)
# ---------------------------------------------------------------------------
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (Pages 2+)
        if self._pageNumber > 1:
            self.drawString(54, 750, "Jumarald Pharmacy & Wellness — Technical Documentation")
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)

        # Footer (All pages)
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(54, 50, 558, 50)
        
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, page_text)
        self.drawString(54, 36, "© 2026 Jumarald Pharmacy & Wellness Ltd. · Confidential")
        self.restoreState()


def create_pdf():
    pdf_filename = "docs/JUMARALD_PHARMACY_DOCUMENTATION.pdf"
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=64
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    COLOR_PRIMARY = colors.HexColor("#10B981") # Emerald
    COLOR_DARK = colors.HexColor("#0F172A")    # Slate 900
    COLOR_MUTED = colors.HexColor("#475569")   # Slate 600

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=COLOR_PRIMARY,
        alignment=1, # Center
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=11,
        leading=15,
        textColor=COLOR_MUTED,
        alignment=1,
        spaceAfter=20
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=COLOR_PRIMARY,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=COLOR_DARK,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=COLOR_DARK,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=4
    )

    story = []

    # Title & Header Block
    story.append(Spacer(1, 10))
    story.append(Paragraph("Jumarald Pharmacy & Wellness", title_style))
    story.append(Paragraph("Full Technical Architecture, Security & Operational Documentation — v3.0.0", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=COLOR_PRIMARY, spaceBefore=0, spaceAfter=15))

    # Executive Summary
    story.append(Paragraph("1. Executive Summary", h1_style))
    story.append(Paragraph(
        "<b>Jumarald Pharmacy & Wellness</b> is a state-of-the-art digital healthcare platform operating in Ghana. "
        "The system unifies e-commerce pharmaceutical sales, certified prescription validation, telehealth physician appointments, "
        "real-time multi-branch inventory tracking, and an intelligent <b>Superintendent Clinical AI Assistant ('Dr. Jumarald AI')</b>.",
        body_style
    ))
    story.append(Paragraph(
        "The platform complies strictly with the Food and Drugs Authority (FDA Ghana), Pharmacy Council regulations, and the "
        "Ghana Data Protection Act 2012 (Act 843).<br/>"
        "<b>Superintendent Pharmacist:</b> Pharm. Philip Bruce-Tagoe (GPHC Reg. No. 2050984).",
        body_style
    ))

    # System Architecture
    story.append(Paragraph("2. System Architecture & Tech Stack", h1_style))
    story.append(Paragraph("The solution is deployed as a modular, high-performance monorepo:", body_style))

    table_data = [
        [Paragraph("<b>Layer</b>", body_style), Paragraph("<b>Technology Stack</b>", body_style), Paragraph("<b>Role / Function</b>", body_style)],
        [Paragraph("Frontend Storefront", body_style), Paragraph("Next.js 15, React 19, Tailwind CSS", body_style), Paragraph("Patient portal, catalog, AI chat widget, reviews", body_style)],
        [Paragraph("Admin Console", body_style), Paragraph("Next.js 15, Recharts, Lucide Icons", body_style), Paragraph("Operational management, global inventory reports", body_style)],
        [Paragraph("Backend API", body_style), Paragraph("Express.js 4, TypeScript, Socket.io", body_style), Paragraph("REST API endpoints, WebSockets, Paystack webhooks", body_style)],
        [Paragraph("Database & ORM", body_style), Paragraph("Neon PostgreSQL, Prisma ORM", body_style), Paragraph("Relational data, schema safety, ACID transactions", body_style)],
        [Paragraph("Clinical AI Engine", body_style), Paragraph("OpenAI GPT-4o-mini / Gemini 1.5", body_style), Paragraph("Autonomous intent classification & multi-tool execution", body_style)],
        [Paragraph("Security & Auth", body_style), Paragraph("JWT, bcrypt, Zod, Rate Limiters", body_style), Paragraph("RBAC, token validation, resource rate limits", body_style)],
    ]

    t = Table(table_data, colWidths=[110, 160, 234])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0F172A")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))

    # Superintendent AI Assistant
    story.append(Paragraph("3. Superintendent AI Assistant ('Dr. Jumarald AI')", h1_style))
    story.append(Paragraph(
        "Dr. Jumarald AI provides clinical triage and product recommendations. It incorporates autonomous intent classification, "
        "structured tool execution, and a high-reliability rule-based fallback engine:",
        body_style
    ))
    
    ai_tools = [
        "<b>searchProducts:</b> Multi-keyword catalog query returning live prices in GH₵ and availability.",
        "<b>getProductDetails:</b> Retrieves dosages, indications, and active ingredients.",
        "<b>checkDrugInteraction:</b> Pharmacological contraindication analysis across multiple active medications.",
        "<b>findNearbyBranches:</b> Locates physical branches, operating hours, and pickup details.",
        "<b>getUserOrders:</b> Fetches patient order tracking status for authenticated sessions.",
        "<b>createPharmacistConsultation:</b> Escalates complex cases to the Superintendent Pharmacist queue."
    ]
    for tool in ai_tools:
        story.append(Paragraph(f"• {tool}", bullet_style))

    # Security & CIA Triad
    story.append(Paragraph("4. Security Architecture (CIA Triad)", h1_style))
    story.append(Paragraph("<b>4.1 Confidentiality:</b> Stateless JWT sessions, bcrypt password hashing, and active user verification in <code>authenticateToken</code> middleware.", body_style))
    story.append(Paragraph("<b>4.2 Integrity:</b> Prisma ACID transactions for inventory updates, Zod input validation, and Paystack HMAC SHA-512 signature verification.", body_style))
    story.append(Paragraph("<b>4.3 Availability:</b> Rate limiters applied to <code>/api/v1/auth</code> (20/15m), <code>/api/v1/ai</code> (20/m), <code>/api/v1/prescriptions</code> (30/15m), and <code>/api/v1/orders</code> (120/m).", body_style))

    # Legal Suite
    story.append(Paragraph("5. Regulatory Compliance Suite", h1_style))
    story.append(Paragraph("• <b>Acceptable Use Policy (<code>/acceptable-use</code>):</b> Rules against prescription forgery, identity theft, and prompt-injection.", bullet_style))
    story.append(Paragraph("• <b>Terms of Service (<code>/terms</code>):</b> Prescription verification guidelines, cold-chain transport, and non-returnable drug rules.", bullet_style))
    story.append(Paragraph("• <b>Privacy Policy (<code>/privacy</code>):</b> Patient rights and data protection standards under the <b>Ghana Data Protection Act 2012 (Act 843)</b>.", bullet_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print("Generated docs/JUMARALD_PHARMACY_DOCUMENTATION.pdf successfully.")

create_pdf()
