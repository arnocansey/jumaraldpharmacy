import { prisma } from "../lib/prisma";

async function clearCatalog() {
  console.log("🧹 Clearing all products, categories, and brands from database...");

  try {
    // 1. Delete dependent transactional product tables
    await prisma.cartItem.deleteMany();
    await prisma.wishlist.deleteMany();
    await prisma.compareItem.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.prescriptionItem.deleteMany();
    await prisma.review.deleteMany();
    await prisma.batchExpiry.deleteMany();
    await prisma.branchInventory.deleteMany();
    await prisma.stockTransfer.deleteMany();
    await prisma.medicineInteraction.deleteMany();

    // 2. Delete main catalog entities
    const deletedProducts = await prisma.product.deleteMany();
    console.log(`✅ Deleted ${deletedProducts.count} products.`);

    const deletedCategories = await prisma.category.deleteMany();
    console.log(`✅ Deleted ${deletedCategories.count} categories.`);

    const deletedBrands = await prisma.brand.deleteMany();
    console.log(`✅ Deleted ${deletedBrands.count} brands.`);

    console.log("🎉 Product catalog and categories cleared completely!");
  } catch (error) {
    console.error("❌ Failed to clear catalog:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearCatalog();
