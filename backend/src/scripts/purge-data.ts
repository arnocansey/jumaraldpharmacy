import { prisma } from "../lib/prisma";

async function runPurgeCLI() {
  console.log("⚠️ Starting Jumarald Pharmacy Database Purge...");
  console.log("Preserving ADMIN, SUPER_ADMIN, and PHARMACIST accounts while clearing transactional data & customer credentials...");

  const adminRoles = ["SUPER_ADMIN", "ADMIN", "PHARMACIST"];

  try {
    console.log("🧹 Clearing transactional tables...");
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.deliveryStatusLog.deleteMany();
    await prisma.deliveryTracking.deleteMany();
    await prisma.order.deleteMany();
    await prisma.prescriptionItem.deleteMany();
    await prisma.prescriptionVerificationLog.deleteMany();
    await prisma.prescription.deleteMany();
    await prisma.consultation.deleteMany();
    await prisma.doctor.deleteMany();
    await prisma.loyaltyPoint.deleteMany();
    await prisma.loyaltyRedemption.deleteMany();
    await prisma.loyaltyRewardClaim.deleteMany();
    await prisma.loyaltyAccount.deleteMany();
    await prisma.review.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.wishlist.deleteMany();
    await prisma.compareItem.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.passwordResetToken.deleteMany();
    await prisma.refreshToken.deleteMany();

    console.log("🧹 Deleting non-admin customer addresses...");
    await prisma.address.deleteMany({
      where: {
        user: {
          role: { notIn: adminRoles as any[] },
        },
      },
    });

    console.log("👤 Deleting non-admin user credentials...");
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        role: { notIn: adminRoles as any[] },
      },
    });

    console.log(`✅ Successfully deleted ${deletedUsers.count} non-admin user accounts.`);

    const remainingUsers = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true },
    });

    console.log("🛡️ Preserved Admin Accounts:");
    remainingUsers.forEach((u) => console.log(` - ${u.name} (${u.email}) [${u.role}]`));

    console.log("🎉 Database purge complete! Tables and schema remain intact.");
  } catch (err) {
    console.error("❌ Purge failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPurgeCLI();
