import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";

async function runBackupCLI() {
  console.log("📦 Starting Jumarald Pharmacy Database Backup...");
  const BACKUP_DIR = path.join(process.cwd(), "backups");

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `jumarald_backup_${timestamp}.json`;
  const filePath = path.join(BACKUP_DIR, filename);

  try {
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

    const dump = {
      version: "3.0",
      timestamp: new Date().toISOString(),
      generator: "Jumarald Pharmacy CLI Backup",
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

    fs.writeFileSync(filePath, JSON.stringify(dump, null, 2), "utf8");
    const stats = fs.statSync(filePath);

    let totalRecords = 0;
    Object.values(dump.tables).forEach((t: any) => {
      totalRecords += Array.isArray(t) ? t.length : 0;
    });

    console.log(`✅ Backup successfully saved to: ${filePath}`);
    console.log(`📊 Total Records Exported: ${totalRecords}`);
    console.log(`💾 Backup File Size: ${(stats.size / 1024).toFixed(2)} KB`);
  } catch (err) {
    console.error("❌ Backup process failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runBackupCLI();
