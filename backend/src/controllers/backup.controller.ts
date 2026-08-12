import { AuthenticatedRequest } from "../middleware/auth";
import { Response } from "express";
import { prisma } from "../lib/prisma";
import { createAuditLog } from "../lib/audit";
import fs from "fs";
import path from "path";

const BACKUP_DIR = path.join(process.cwd(), "backups");

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export interface BackupMetadata {
  filename: string;
  version: string;
  timestamp: string;
  sizeBytes: number;
  totalRecords: number;
  tables: Record<string, number>;
}

/**
 * Creates a complete JSON snapshot of all core database tables
 */
export async function createBackup(req: AuthenticatedRequest, res: Response) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `jumarald_backup_${timestamp}.json`;
    const filePath = path.join(BACKUP_DIR, filename);

    // Fetch data from all tables
    const [
      users,
      categories,
      brands,
      products,
      batchExpiries,
      branches,
      branchStaff,
      branchInventory,
      stockTransfers,
      addresses,
      orders,
      orderItems,
      payments,
      prescriptions,
      prescriptionItems,
      doctors,
      consultations,
      medicineInteractions,
      deliveryTracking,
      loyaltyAccounts,
      loyaltyPoints,
      reviews,
      coupons,
      blogPosts,
      comments,
      faqs,
      testimonials,
      notifications,
      auditLogs,
      systemSettings,
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.category.findMany(),
      prisma.brand.findMany(),
      prisma.product.findMany(),
      prisma.batchExpiry.findMany(),
      prisma.branch.findMany(),
      prisma.branchStaff.findMany(),
      prisma.branchInventory.findMany(),
      prisma.stockTransfer.findMany(),
      prisma.address.findMany(),
      prisma.order.findMany(),
      prisma.orderItem.findMany(),
      prisma.payment.findMany(),
      prisma.prescription.findMany(),
      prisma.prescriptionItem.findMany(),
      prisma.doctor.findMany(),
      prisma.consultation.findMany(),
      prisma.medicineInteraction.findMany(),
      prisma.deliveryTracking.findMany(),
      prisma.loyaltyAccount.findMany(),
      prisma.loyaltyPoint.findMany(),
      prisma.review.findMany(),
      prisma.coupon.findMany(),
      prisma.blogPost.findMany(),
      prisma.comment.findMany(),
      prisma.fAQ.findMany(),
      prisma.testimonial.findMany(),
      prisma.notification.findMany(),
      prisma.auditLog.findMany(),
      prisma.systemSetting.findMany(),
    ]);

    const dataDump = {
      version: "3.0",
      timestamp: new Date().toISOString(),
      generator: "Jumarald Pharmacy Backup Engine",
      tables: {
        users,
        categories,
        brands,
        products,
        batchExpiries,
        branches,
        branchStaff,
        branchInventory,
        stockTransfers,
        addresses,
        orders,
        orderItems,
        payments,
        prescriptions,
        prescriptionItems,
        doctors,
        consultations,
        medicineInteractions,
        deliveryTracking,
        loyaltyAccounts,
        loyaltyPoints,
        reviews,
        coupons,
        blogPosts,
        comments,
        faqs,
        testimonials,
        notifications,
        auditLogs,
        systemSettings,
      },
    };

    const jsonString = JSON.stringify(dataDump, null, 2);
    fs.writeFileSync(filePath, jsonString, "utf8");

    const stats = fs.statSync(filePath);
    const tableCounts: Record<string, number> = {};
    let totalRecords = 0;

    Object.entries(dataDump.tables).forEach(([key, val]) => {
      const count = Array.isArray(val) ? val.length : 0;
      tableCounts[key] = count;
      totalRecords += count;
    });

    if (req.user?.id) {
      await createAuditLog(req.user.id, "BACKUP_CREATED", "system", filename, {
        filename,
        totalRecords,
        sizeBytes: stats.size,
      });
    }

    return res.json({
      status: "success",
      message: "Database backup created successfully",
      data: {
        filename,
        timestamp: dataDump.timestamp,
        sizeBytes: stats.size,
        sizeFormatted: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
        totalRecords,
        tableCounts,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to create database backup: " + (error.message || "") });
  }
}

/**
 * Lists all existing backup snapshots in backend/backups
 */
export async function listBackups(_req: AuthenticatedRequest, res: Response) {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return res.json({ status: "success", backups: [] });
    }

    const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith(".json"));

    const backups = files.map((filename) => {
      const filePath = path.join(BACKUP_DIR, filename);
      const stats = fs.statSync(filePath);
      let totalRecords = 0;
      let timestamp = stats.mtime.toISOString();

      try {
        const content = fs.readFileSync(filePath, "utf8");
        const parsed = JSON.parse(content);
        timestamp = parsed.timestamp || timestamp;
        if (parsed.tables) {
          totalRecords = Object.values(parsed.tables).reduce((acc: number, val: any) => acc + (Array.isArray(val) ? val.length : 0), 0);
        }
      } catch {
        // Fallback if parsing fails
      }

      return {
        filename,
        timestamp,
        sizeBytes: stats.size,
        sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`,
        totalRecords,
      };
    });

    backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return res.json({ status: "success", backups });
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to list backups" });
  }
}

/**
 * Downloads a backup snapshot file
 */
export async function downloadBackup(req: AuthenticatedRequest, res: Response) {
  try {
    const { filename } = req.params;
    const safeFilename = path.basename(filename);
    const filePath = path.join(BACKUP_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Backup file not found" });
    }

    return res.download(filePath, safeFilename);
  } catch {
    return res.status(500).json({ message: "Failed to download backup" });
  }
}

/**
 * Deletes a backup snapshot file
 */
export async function deleteBackup(req: AuthenticatedRequest, res: Response) {
  try {
    const { filename } = req.params;
    const safeFilename = path.basename(filename);
    const filePath = path.join(BACKUP_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Backup file not found" });
    }

    fs.unlinkSync(filePath);

    if (req.user?.id) {
      await createAuditLog(req.user.id, "BACKUP_DELETED", "system", safeFilename);
    }

    return res.json({ status: "success", message: "Backup file deleted successfully" });
  } catch {
    return res.status(500).json({ message: "Failed to delete backup" });
  }
}

/**
 * Restores database state from a backup JSON snapshot
 */
export async function restoreBackup(req: AuthenticatedRequest, res: Response) {
  try {
    const { filename } = req.params;
    const safeFilename = path.basename(filename);
    const filePath = path.join(BACKUP_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Backup file not found" });
    }

    const raw = fs.readFileSync(filePath, "utf8");
    const backup = JSON.parse(raw);

    if (!backup.tables) {
      return res.status(400).json({ message: "Invalid backup format: missing tables data" });
    }

    const t = backup.tables;

    // Execute sequential restoration inside transaction
    await prisma.$transaction(async (tx) => {
      // 1. Clear existing dependent records
      await tx.payment.deleteMany();
      await tx.orderItem.deleteMany();
      await tx.deliveryStatusLog.deleteMany();
      await tx.deliveryTracking.deleteMany();
      await tx.order.deleteMany();
      await tx.prescriptionItem.deleteMany();
      await tx.prescriptionVerificationLog.deleteMany();
      await tx.prescription.deleteMany();
      await tx.consultation.deleteMany();
      await tx.doctor.deleteMany();
      await tx.loyaltyPoint.deleteMany();
      await tx.loyaltyRedemption.deleteMany();
      await tx.loyaltyRewardClaim.deleteMany();
      await tx.loyaltyAccount.deleteMany();
      await tx.review.deleteMany();
      await tx.cartItem.deleteMany();
      await tx.wishlist.deleteMany();
      await tx.compareItem.deleteMany();
      await tx.branchInventory.deleteMany();
      await tx.stockTransfer.deleteMany();
      await tx.batchExpiry.deleteMany();
      await tx.product.deleteMany();
      await tx.brand.deleteMany();
      await tx.category.deleteMany();
      await tx.address.deleteMany();
      await tx.refreshToken.deleteMany();
      await tx.branchStaff.deleteMany();
      await tx.branch.deleteMany();
      await tx.comment.deleteMany();
      await tx.blogPost.deleteMany();
      await tx.coupon.deleteMany();
      await tx.fAQ.deleteMany();
      await tx.testimonial.deleteMany();
      await tx.notification.deleteMany();
      await tx.auditLog.deleteMany();
      await tx.systemSetting.deleteMany();
      await tx.user.deleteMany();

      // 2. Restore core entities
      if (t.users?.length) await tx.user.createMany({ data: t.users, skipDuplicates: true });
      if (t.categories?.length) await tx.category.createMany({ data: t.categories, skipDuplicates: true });
      if (t.brands?.length) await tx.brand.createMany({ data: t.brands, skipDuplicates: true });
      if (t.products?.length) await tx.product.createMany({ data: t.products, skipDuplicates: true });
      if (t.branches?.length) await tx.branch.createMany({ data: t.branches, skipDuplicates: true });
      if (t.branchStaff?.length) await tx.branchStaff.createMany({ data: t.branchStaff, skipDuplicates: true });
      if (t.branchInventory?.length) await tx.branchInventory.createMany({ data: t.branchInventory, skipDuplicates: true });
      if (t.batchExpiries?.length) await tx.batchExpiry.createMany({ data: t.batchExpiries, skipDuplicates: true });
      if (t.addresses?.length) await tx.address.createMany({ data: t.addresses, skipDuplicates: true });
      if (t.prescriptions?.length) await tx.prescription.createMany({ data: t.prescriptions, skipDuplicates: true });
      if (t.prescriptionItems?.length) await tx.prescriptionItem.createMany({ data: t.prescriptionItems, skipDuplicates: true });
      if (t.doctors?.length) await tx.doctor.createMany({ data: t.doctors, skipDuplicates: true });
      if (t.consultations?.length) await tx.consultation.createMany({ data: t.consultations, skipDuplicates: true });
      if (t.orders?.length) await tx.order.createMany({ data: t.orders, skipDuplicates: true });
      if (t.orderItems?.length) await tx.orderItem.createMany({ data: t.orderItems, skipDuplicates: true });
      if (t.payments?.length) await tx.payment.createMany({ data: t.payments, skipDuplicates: true });
      if (t.deliveryTracking?.length) await tx.deliveryTracking.createMany({ data: t.deliveryTracking, skipDuplicates: true });
      if (t.loyaltyAccounts?.length) await tx.loyaltyAccount.createMany({ data: t.loyaltyAccounts, skipDuplicates: true });
      if (t.loyaltyPoints?.length) await tx.loyaltyPoint.createMany({ data: t.loyaltyPoints, skipDuplicates: true });
      if (t.reviews?.length) await tx.review.createMany({ data: t.reviews, skipDuplicates: true });
      if (t.coupons?.length) await tx.coupon.createMany({ data: t.coupons, skipDuplicates: true });
      if (t.blogPosts?.length) await tx.blogPost.createMany({ data: t.blogPosts, skipDuplicates: true });
      if (t.comments?.length) await tx.comment.createMany({ data: t.comments, skipDuplicates: true });
      if (t.faqs?.length) await tx.fAQ.createMany({ data: t.faqs, skipDuplicates: true });
      if (t.testimonials?.length) await tx.testimonial.createMany({ data: t.testimonials, skipDuplicates: true });
      if (t.notifications?.length) await tx.notification.createMany({ data: t.notifications, skipDuplicates: true });
      if (t.auditLogs?.length) await tx.auditLog.createMany({ data: t.auditLogs, skipDuplicates: true });
      if (t.systemSettings?.length) await tx.systemSetting.createMany({ data: t.systemSettings, skipDuplicates: true });
    });

    if (req.user?.id) {
      await createAuditLog(req.user.id, "BACKUP_RESTORED", "system", safeFilename);
    }

    return res.json({ status: "success", message: "Database restored successfully from backup snapshot" });
  } catch (error: any) {
    return res.status(500).json({ message: "Database restoration failed: " + (error.message || "") });
  }
}

/**
 * Exports a specific table as a downloadable CSV file
 */
export async function exportTableCSV(req: AuthenticatedRequest, res: Response) {
  try {
    const { table } = req.params;
    let data: any[] = [];
    let filename = `${table}_export_${Date.now()}.csv`;

    switch (table.toLowerCase()) {
      case "users":
        data = await prisma.user.findMany({ select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true } });
        break;
      case "orders":
        data = await prisma.order.findMany({ select: { id: true, orderNumber: true, status: true, totalAmount: true, createdAt: true } });
        break;
      case "products":
        data = await prisma.product.findMany({ select: { id: true, name: true, sku: true, price: true, stockQuantity: true, requiresPrescription: true } });
        break;
      case "prescriptions":
        data = await prisma.prescription.findMany({ select: { id: true, userId: true, status: true, isVerified: true, createdAt: true } });
        break;
      case "audit_logs":
        data = await prisma.auditLog.findMany({ select: { id: true, userId: true, action: true, entity: true, createdAt: true } });
        break;
      default:
        return res.status(400).json({ message: "Unsupported table for CSV export" });
    }

    if (data.length === 0) {
      return res.status(400).json({ message: "No records found to export" });
    }

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) =>
      Object.values(row)
        .map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );

    const csvContent = [headers, ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(csvContent);
  } catch (error: any) {
    return res.status(500).json({ message: "CSV export failed: " + (error.message || "") });
  }
}
