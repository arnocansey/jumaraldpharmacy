import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PRODUCTS = [
  {
    name: "Coartem 80/480mg Tablets (Artemether/Lumefantrine)",
    slug: "coartem-80-480mg-tablets",
    sku: "MED-MAL-001",
    description: "First-line ACT antimalarial treatment for acute uncomplicated P. falciparum malaria infections.",
    price: 45.0,
    compareAtPrice: 55.0,
    stockQuantity: 150,
    requiresPrescription: true,
    categorySlug: "prescription-medications",
    brandName: "Novartis",
    dosageForm: "Tablet",
    strength: "80mg/480mg",
    activeIngredients: "Artemether 80mg, Lumefantrine 480mg",
    usageInstructions: "Take with fatty food or milk according to age/weight dosage regimen prescribed by your doctor.",
    sideEffects: "Headache, dizziness, loss of appetite, nausea.",
    warnings: "Complete full 3-day course. Do not interrupt treatment early.",
    images: ["/images/products/coartem.jpg"],
    isFeatured: true,
    rating: 4.9,
    reviewCount: 28,
  },
  {
    name: "SD Codefree Blood Glucose Meter Kit",
    slug: "sd-codefree-blood-glucose-meter-kit",
    sku: "DEV-DIA-001",
    description: "Complete diabetic blood sugar monitoring kit with meter, lancing device, 10 lancets, carrying case, and manual.",
    price: 185.0,
    compareAtPrice: 245.0, // 24% off flash sale
    stockQuantity: 85,
    requiresPrescription: false,
    categorySlug: "medical-devices",
    brandName: "SD Biosensor",
    dosageForm: "Device Kit",
    activeIngredients: "Blood Glucose Test Strip Biosensor",
    usageInstructions: "Apply small drop of blood to test strip tip for 5-second reading.",
    sideEffects: "",
    warnings: "Keep test strips sealed from moisture. Use codefree test strips.",
    images: ["/images/products/sd-codefree.jpg"],
    isFeatured: true,
    rating: 4.8,
    reviewCount: 42,
  },
  {
    name: "Omron M2 Basic Automatic Upper Arm Blood Pressure Monitor",
    slug: "omron-m2-basic-blood-pressure-monitor",
    sku: "DEV-HYP-001",
    description: "Clinically validated digital blood pressure monitor with Intellisense technology for accurate hypertension tracking.",
    price: 320.0,
    compareAtPrice: 420.0, // 24% off flash sale
    stockQuantity: 40,
    requiresPrescription: false,
    categorySlug: "medical-devices",
    brandName: "Omron",
    dosageForm: "Digital Monitor",
    activeIngredients: "Digital Oscillometric Sensor",
    usageInstructions: "Wrap cuff around upper arm at heart level while seated quietly.",
    sideEffects: "",
    warnings: "Avoid coffee and exercise 30 minutes before measurement.",
    images: ["/images/products/omron-m2.jpg"],
    isFeatured: true,
    rating: 4.9,
    reviewCount: 35,
  },
  {
    name: "Amoxil 500mg Capsules (Amoxicillin Trihydrate)",
    slug: "amoxil-500mg-capsules",
    sku: "MED-ANT-001",
    description: "Broad-spectrum penicillin antibiotic for bacterial ear, nose, throat, respiratory, and urinary tract infections.",
    price: 35.0,
    compareAtPrice: 42.0,
    stockQuantity: 200,
    requiresPrescription: true,
    categorySlug: "prescription-medications",
    brandName: "GSK",
    dosageForm: "Capsule",
    strength: "500mg",
    activeIngredients: "Amoxicillin Trihydrate 500mg",
    usageInstructions: "Take one capsule 8-hourly with water.",
    sideEffects: "Mild diarrhea, rash, stomach upset.",
    warnings: "Do not use if allergic to penicillin antibiotics.",
    images: ["/images/products/amoxil-500.jpg"],
    isFeatured: true,
    rating: 4.7,
    reviewCount: 19,
  },
  {
    name: "Glucophage 500mg Tablets (Metformin Hydrochloride)",
    slug: "glucophage-500mg-tablets",
    sku: "MED-DIA-002",
    description: "Essential oral antihyperglycemic agent for first-line Type 2 Diabetes mellitus management.",
    price: 48.0,
    compareAtPrice: 58.0,
    stockQuantity: 120,
    requiresPrescription: true,
    categorySlug: "chronic-disease",
    brandName: "Merck",
    dosageForm: "Tablet",
    strength: "500mg",
    activeIngredients: "Metformin HCl 500mg",
    usageInstructions: "Take with or immediately after meals to reduce gastrointestinal upset.",
    sideEffects: "Nausea, abdominal discomfort, diarrhea.",
    warnings: "Monitor renal function regularly.",
    images: ["/images/products/glucophage.jpg"],
    isFeatured: true,
    rating: 4.8,
    reviewCount: 31,
  },
  {
    name: "Wellwoman Original Multivitamin Capsules",
    slug: "wellwoman-original-multivitamin-capsules",
    sku: "SUP-VIT-001",
    description: "Advanced daily nutritional supplement specially formulated for women with evening primrose, starflower oil, and iron.",
    price: 110.0,
    compareAtPrice: 135.0,
    stockQuantity: 95,
    requiresPrescription: false,
    categorySlug: "vitamins-supplements",
    brandName: "Vitabiotics",
    dosageForm: "Capsule",
    activeIngredients: "Multivitamins, Evening Primrose Oil, Iron, Zinc, Vitamin D3",
    usageInstructions: "Take one capsule daily with your main meal.",
    sideEffects: "",
    warnings: "Swallow whole with water. Do not chew.",
    images: ["/images/products/wellwoman.jpg"],
    isFeatured: true,
    rating: 4.9,
    reviewCount: 56,
  },
  {
    name: "Wellman Original Multivitamin Tablets",
    slug: "wellman-original-multivitamin-tablets",
    sku: "SUP-VIT-002",
    description: "Comprehensive health supplement tailored for men's energy, immune system, reproductive health, and vitality.",
    price: 110.0,
    compareAtPrice: 135.0,
    stockQuantity: 110,
    requiresPrescription: false,
    categorySlug: "vitamins-supplements",
    brandName: "Vitabiotics",
    dosageForm: "Tablet",
    activeIngredients: "Ginseng, CoQ10, L-Carnitine, Zinc, Vitamins B6, B12, C, D",
    usageInstructions: "Take one tablet daily with your main meal.",
    sideEffects: "",
    warnings: "Take on a full stomach.",
    images: ["/images/products/wellman.jpg"],
    isFeatured: false,
    rating: 4.8,
    reviewCount: 44,
  },
  {
    name: "Parafizz Effervescent Paracetamol 1000mg",
    slug: "parafizz-effervescent-paracetamol-1000mg",
    sku: "OTC-PAI-001",
    description: "Fast-acting soluble pain relief and fever reducer for headaches, body pains, and cold symptoms.",
    price: 25.0,
    compareAtPrice: 30.0,
    stockQuantity: 250,
    requiresPrescription: false,
    categorySlug: "over-the-counter",
    brandName: "Ernest Chemists",
    dosageForm: "Effervescent Tablet",
    strength: "1000mg",
    activeIngredients: "Paracetamol 1000mg",
    usageInstructions: "Dissolve 1 tablet in half a glass of water every 6 hours PRN.",
    sideEffects: "Rare at recommended doses.",
    warnings: "Do not exceed 4g (4000mg) total paracetamol per 24 hours.",
    images: ["/images/products/parafizz.jpg"],
    isFeatured: false,
    rating: 4.9,
    reviewCount: 38,
  },
];

async function main() {
  console.log("🌱 Seeding full product catalog...");

  for (const prodData of PRODUCTS) {
    const { categorySlug, brandName, ...rest } = prodData;

    // Find category
    let category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: categorySlug.replace(/-/g, " ").toUpperCase(),
          slug: categorySlug,
          description: `Products under ${categorySlug}`,
        },
      });
    }

    // Upsert Brand
    let brandId: string | undefined = undefined;
    if (brandName) {
      const brand = await prisma.brand.upsert({
        where: { slug: brandName.toLowerCase().replace(/\s+/g, "-") },
        update: {},
        create: {
          name: brandName,
          slug: brandName.toLowerCase().replace(/\s+/g, "-"),
        },
      });
      brandId = brand.id;
    }

    // Upsert Product
    const product = await prisma.product.upsert({
      where: { slug: rest.slug },
      update: {
        price: rest.price,
        compareAtPrice: rest.compareAtPrice,
        stockQuantity: rest.stockQuantity,
        requiresPrescription: rest.requiresPrescription,
        isFeatured: rest.isFeatured,
        rating: rest.rating,
        reviewCount: rest.reviewCount,
      },
      create: {
        ...rest,
        categoryId: category.id,
        brandId,
      },
    });

    console.log(`✅ Upserted product: ${product.name} (GHS ${product.price})`);
  }

  console.log("🎉 Products seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Failed to seed products:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
