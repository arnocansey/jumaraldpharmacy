import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = [
  {
    name: "Prescription Medications",
    slug: "prescription-medications",
    description: "Medications requiring a valid prescription from a licensed healthcare provider",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80",
  },
  {
    name: "Over-the-Counter (OTC)",
    slug: "over-the-counter",
    description: "Non-prescription medications available without a doctor's order",
    imageUrl: "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=800&q=80",
  },
  {
    name: "Vitamins & Supplements",
    slug: "vitamins-supplements",
    description: "Daily health supplements, minerals, multivitamins, and herbal supplements",
    imageUrl: "https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=800&q=80",
  },
  {
    name: "Personal Care & Hygiene",
    slug: "personal-care",
    description: "Soaps, lotions, dental care, hair care, and feminine hygiene products",
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80",
  },
  {
    name: "Baby & Child Health",
    slug: "baby-child-health",
    description: "Pediatric medications, baby formula, diapers, and child wellness products",
    imageUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&q=80",
  },
  {
    name: "Medical Devices & Equipment",
    slug: "medical-devices",
    description: "Blood pressure monitors, glucose meters, nebulizers, and diagnostic tools",
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
  },
  {
    name: "First Aid & Wound Care",
    slug: "first-aid",
    description: "Bandages, antiseptics, wound dressings, and emergency care supplies",
    imageUrl: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=800&q=80",
  },
  {
    name: "Chronic Disease Management",
    slug: "chronic-disease",
    description: "Products for managing diabetes, hypertension, asthma, and other chronic conditions",
    imageUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80",
  },
  {
    name: "Women's Health",
    slug: "womens-health",
    description: "Feminine care, reproductive health, prenatal vitamins, and menopause support",
    imageUrl: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&q=80",
  },
  {
    name: "Men's Health",
    slug: "mens-health",
    description: "Men's wellness, grooming, and health supplements",
    imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80",
  },
  {
    name: "Elderly Care",
    slug: "elderly-care",
    description: "Products for senior citizens including mobility aids and age-specific medications",
    imageUrl: "https://images.unsplash.com/photo-1581579438747-1dc8d1e05dd0?w=800&q=80",
  },
  {
    name: "Nutrition & Food",
    slug: "nutrition-food",
    description: "Specialty foods, nutritional drinks, and dietary products",
    imageUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80",
  },
];

const HEALTH_CONDITIONS = [
  {
    name: "Malaria Prevention & Treatment",
    slug: "malaria",
    description: "Antimalarial medications and prevention supplies",
    imageUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&q=80",
  },
  {
    name: "Diabetes Care",
    slug: "diabetes",
    description: "Glucose monitors, insulin, test strips, and diabetes management",
    imageUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80",
  },
  {
    name: "Hypertension Management",
    slug: "hypertension",
    description: "Blood pressure monitors and cardiovascular medications",
    imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80",
  },
  {
    name: "Respiratory Health",
    slug: "respiratory",
    description: "Asthma inhalers, nebulizers, and respiratory medications",
    imageUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&q=80",
  },
  {
    name: "Pain Management",
    slug: "pain-management",
    description: "Pain relievers, anti-inflammatory medications, and topical treatments",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80",
  },
  {
    name: "Digestive Health",
    slug: "digestive-health",
    description: "Antacids, laxatives, and gastrointestinal medications",
    imageUrl: "https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=800&q=80",
  },
  {
    name: "Skin Care & Dermatology",
    slug: "skin-care",
    description: "Topical treatments, moisturizers, and skin condition medications",
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80",
  },
  {
    name: "Allergy & Sinus",
    slug: "allergy-sinus",
    description: "Antihistamines, decongestants, and allergy relief products",
    imageUrl: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=800&q=80",
  },
];

async function main() {
  console.log("Seeding categories with custom distinct images...");

  const ALL = [...CATEGORIES, ...HEALTH_CONDITIONS];

  for (const cat of ALL) {
    const existing = await prisma.category.findFirst({
      where: { OR: [{ slug: cat.slug }, { name: cat.name }] },
    });
    if (!existing) {
      await prisma.category.create({ data: cat });
      console.log(`Created category: ${cat.name}`);
    } else {
      await prisma.category.update({
        where: { id: existing.id },
        data: { imageUrl: cat.imageUrl, description: cat.description },
      });
      console.log(`Updated category image: ${cat.name}`);
    }
  }

  console.log("Category image seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
