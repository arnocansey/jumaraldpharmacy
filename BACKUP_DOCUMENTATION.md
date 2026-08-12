# Jumarald Pharmacy — Data Backup & Disaster Recovery Guide

This document outlines the backup and disaster recovery infrastructure implemented for **Jumarald Pharmacy**.

---

## 🌟 Implemented Backup Systems

### **Option 1: CLI Database Snapshot & Restoration Tool**
Command-line backup and restoration scripts integrated directly into the `backend`.

#### **Usage Commands**
From the root directory or `backend/` directory:

1. **Create a Full Database Backup**:
   ```bash
   pnpm --filter jumarald-pharmacy-backend db:backup
   # OR inside backend directory:
   pnpm db:backup
   ```
   * Creates a timestamped `.json` file in `backend/backups/` containing all database tables (`Users`, `Orders`, `Prescriptions`, `Products`, `AuditLogs`, etc.).

2. **Restore Database from Snapshot**:
   ```bash
   pnpm --filter jumarald-pharmacy-backend db:restore <filename_or_path>
   # Example:
   pnpm db:restore jumarald_backup_2026-08-12T16-40-48.json
   ```
   * Safely clears current database records and re-hydrates state from the specified snapshot.

---

### **Option 2: Admin Dashboard Backup Vault (UI Interface)**
An interactive management center located at **`/admin/backups`** (accessible via the Admin Sidebar under **System → Backups**).

#### **Key Features**
* **On-Demand Snapshots**: Click **"Backup Database Now"** to generate a live full-system JSON snapshot.
* **Download & Restore**: One-click downloading of backup files or restoring system state with safety warning modals.
* **Table CSV Exporters**: Quick export buttons for:
  * Orders & Payments CSV
  * Registered Patients & Staff CSV
  * Product Catalog CSV
  * Prescriptions History CSV
  * System Audit Logs CSV
* **Storage Metrics**: Real-time display of total backup count, disk space used, and date of the latest backup.

---

## 🚀 Future Roadmap & Setup Instructions for Options 3 & 4

---

### **Option 3: Automated Nightly Cron Job Setup (Cloud / Server)**

To schedule automated daily backups without manual intervention, you can use any of the following methods:

#### **Method A: Server Crontab (Linux / Render / VPS)**
Add a cron entry to run every midnight (00:00 UTC):
```bash
0 0 * * * cd /home/kilgore/Desktop/jumaraldpharmacy/backend && pnpm db:backup >> /var/log/jumarald_backup.log 2>&1
```

#### **Method B: Node-Cron in Backend (`backend/src/services/cron.service.ts`)**
Install `node-cron` in backend:
```bash
pnpm add node-cron
pnpm add -D @types/node-cron
```
Initialize in `server.ts`:
```typescript
import cron from "node-cron";
import { exec } from "child_process";

// Run every midnight
cron.schedule("0 0 * * *", () => {
  console.log("Running scheduled daily backup...");
  exec("pnpm db:backup", (error, stdout) => {
    if (error) console.error("Scheduled backup failed:", error);
    else console.log("Scheduled backup complete:", stdout);
  });
});
```

#### **Method C: GitHub Actions Workflow (`.github/workflows/db-backup.yml`)**
```yaml
name: Scheduled Database Backup
on:
  schedule:
    - cron: '0 0 * * *' # Midnight UTC
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: pnpm install
      - run: pnpm db:backup
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

### **Option 4: Cloudinary Media Backup & Off-Site Sync**

Prescription images and product images are stored on Cloudinary (`CLOUDINARY_CLOUD_NAME=dea43l6ap`).

#### **Sync Command using Cloudinary CLI**
To download all user uploads & prescription documents to local/cloud storage:
```bash
npx cloudinary-cli download_backup --output ./media_backups/
```

#### **Automated AWS S3 / Cloudflare R2 Offsite Mirror Script**
To upload database `.json` snapshots to an off-site S3 bucket:
```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";

const s3 = new S3Client({ region: "us-east-1" });

export async function uploadBackupToS3(filePath: string, filename: string) {
  const fileStream = fs.createReadStream(filePath);
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.BACKUP_S3_BUCKET || "jumarald-backups",
      Key: `db-backups/${filename}`,
      Body: fileStream,
    })
  );
}
```

---

## 🔒 Security & Retention Guidelines

1. **Encryption**: In production, encrypt backup JSON archives using AES-256 before uploading off-site.
2. **Access Control**: Restrict `/api/v1/backups` endpoints to `SUPER_ADMIN` and `ADMIN` roles only.
3. **Retention Policy**: Keep daily backups for 30 days, weekly backups for 12 weeks, and monthly backups for 1 year.
