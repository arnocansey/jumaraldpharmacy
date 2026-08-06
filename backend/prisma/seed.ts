/// <reference types="node" />
import { PrismaClient, RoleName } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Neon PostgreSQL Database for Jumarald Pharmacy Ghana...");

  // 1. Seed Roles
  const roles = [
    { name: RoleName.SUPER_ADMIN, description: "Super Administrator with full access" },
    { name: RoleName.ADMIN, description: "Operations Administrator" },
    { name: RoleName.PHARMACIST, description: "Licensed Superintendent Pharmacist" },
    { name: RoleName.DOCTOR, description: "Telehealth Medical Doctor" },
    { name: RoleName.PATIENT, description: "Patient Account" },
    { name: RoleName.CUSTOMER, description: "Storefront Customer" },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  // 2. Seed Default Admin & Superintendent Pharmacist Users
  const passwordHash = await bcrypt.hash("AdminPassword2026!", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@jumaraldpharmacy.com" },
    update: {},
    create: {
      email: "admin@jumaraldpharmacy.com",
      name: "Jumarald System Admin",
      passwordHash,
      phone: "+233 54 477 2483",
      role: RoleName.SUPER_ADMIN,
    },
  });

  const pharmacistUser = await prisma.user.upsert({
    where: { email: "pharmacist@jumaraldpharmacy.com" },
    update: {},
    create: {
      email: "pharmacist@jumaraldpharmacy.com",
      name: "Pharm. Philip Bruce-Tagoe",
      passwordHash,
      phone: "+233 30 200 4800",
      role: RoleName.PHARMACIST,
    },
  });

  console.log("✅ Users seeded:", adminUser.email, pharmacistUser.email);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
