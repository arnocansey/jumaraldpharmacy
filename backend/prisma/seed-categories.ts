import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "Prescription Medications", slug: "prescription-medications", description: "Medications requiring a valid prescription from a licensed healthcare provider" },
  { name: "Over-the-Counter (OTC)", slug: "over-the-counter", description: "Non-prescription medications available without a doctor's order" },
  { name: "Vitamins & Supplements", slug: "vitamins-supplements", description: "Daily health supplements, minerals, multivitamins, and herbal supplements" },
  { name: "Personal Care & Hygiene", slug: "personal-care", description: "Soaps, lotions, dental care, hair care, and feminine hygiene products" },
  { name: "Baby & Child Health", slug: "baby-child-health", description: "Pediatric medications, baby formula, diapers, and child wellness products" },
  { name: "Medical Devices & Equipment", slug: "medical-devices", description: "Blood pressure monitors, glucose meters, nebulizers, and diagnostic tools" },
  { name: "First Aid & Wound Care", slug: "first-aid", description: "Bandages, antiseptics, wound dressings, and emergency care supplies" },
  { name: "Chronic Disease Management", slug: "chronic-disease", description: "Products for managing diabetes, hypertension, asthma, and other chronic conditions" },
  { name: "Women's Health", slug: "womens-health", description: "Feminine care, reproductive health, prenatal vitamins, and menopause support" },
  { name: "Men's Health", slug: "mens-health", description: "Men's wellness, grooming, and health supplements" },
  { name: "Elderly Care", slug: "elderly-care", description: "Products for senior citizens including mobility aids and age-specific medications" },
  { name: "Nutrition & Food", slug: "nutrition-food", description: "Specialty foods, nutritional drinks, and dietary products" },
];

const HEALTH_CONDITIONS = [
  { name: "Malaria Prevention & Treatment", slug: "malaria", description: "Antimalarial medications and prevention supplies" },
  { name: "Diabetes Care", slug: "diabetes", description: "Glucose monitors, insulin, test strips, and diabetes management" },
  { name: "Hypertension Management", slug: "hypertension", description: "Blood pressure monitors and cardiovascular medications" },
  { name: "Respiratory Health", slug: "respiratory", description: "Asthma inhalers, nebulizers, and respiratory medications" },
  { name: "Pain Management", slug: "pain-management", description: "Pain relievers, anti-inflammatory medications, and topical treatments" },
  { name: "Digestive Health", slug: "digestive-health", description: "Antacids, laxatives, and gastrointestinal medications" },
  { name: "Skin Care & Dermatology", slug: "skin-care", description: "Topical treatments, moisturizers, and skin condition medications" },
  { name: "Allergy & Sinus", slug: "allergy-sinus", description: "Antihistamines, decongestants, and allergy relief products" },
];

async function main() {
  console.log("Seeding categories...");

  // Create main categories
  for (const category of CATEGORIES) {
    const existing = await prisma.category.findUnique({ where: { slug: category.slug } });
    if (!existing) {
      await prisma.category.create({ data: category });
      console.log(`Created category: ${category.name}`);
    } else {
      console.log(`Category already exists: ${category.name}`);
    }
  }

  // Create health condition categories
  for (const condition of HEALTH_CONDITIONS) {
    const existing = await prisma.category.findUnique({ where: { slug: condition.slug } });
    if (!existing) {
      await prisma.category.create({ data: condition });
      console.log(`Created health condition category: ${condition.name}`);
    } else {
      console.log(`Health condition category already exists: ${condition.name}`);
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
