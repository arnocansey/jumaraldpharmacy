import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";

async function runRestoreCLI() {
  const BACKUP_DIR = path.join(process.cwd(), "backups");
  const targetFileArg = process.argv[2];

  if (!targetFileArg) {
    console.error("❌ Usage: pnpm db:restore <backup_filename_or_path>");
    console.log("Example: pnpm db:restore jumarald_backup_2026-08-12.json");
    process.exit(1);
  }

  let filePath = targetFileArg;
  if (!fs.existsSync(filePath)) {
    filePath = path.join(BACKUP_DIR, targetFileArg);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Backup file not found at: ${filePath}`);
    process.exit(1);
  }

  console.log(`⏳ Restoring database from: ${filePath}...`);

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const dump = JSON.parse(raw);

    if (!dump.tables) {
      throw new Error("Invalid backup format: missing 'tables' object.");
    }

    const t = dump.tables;

    await prisma.$transaction(async (tx) => {
      // 1. Wipe existing tables in dependency order
      console.log("🧹 Clearing existing data...");
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

      console.log("📥 Restoring data from backup snapshot...");
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

    console.log("🎉 Database restoration completed successfully!");
  } catch (err) {
    console.error("❌ Restoration failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runRestoreCLI();
