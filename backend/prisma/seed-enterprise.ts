import { PrismaClient, RoleName } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding enterprise data...");

  // Seed Branches
  const branch1 = await prisma.branch.upsert({
    where: { slug: "accra-central" },
    update: {},
    create: {
      name: "Accra Central",
      slug: "accra-central",
      code: "ACC-001",
      address: "123 Oxford Street",
      city: "Accra",
      state: "Greater Accra",
      phone: "+233 54 477 2483",
      email: "central@jumaraldpharmacy.com",
      latitude: 5.5600,
      longitude: -0.1870,
      deliveryRadius: 15,
      operatingHours: { monday: "08:00-20:00", tuesday: "08:00-20:00", wednesday: "08:00-20:00", thursday: "08:00-20:00", friday: "08:00-20:00", saturday: "09:00-18:00", sunday: "10:00-16:00" },
    },
  });

  const branch2 = await prisma.branch.upsert({
    where: { slug: "tema-branch" },
    update: {},
    create: {
      name: "Tema Branch",
      slug: "tema-branch",
      code: "TEM-002",
      address: "45 Independence Avenue",
      city: "Tema",
      state: "Greater Accra",
      phone: "+233 54 477 2484",
      email: "tema@jumaraldpharmacy.com",
      latitude: 5.6698,
      longitude: -0.0166,
      deliveryRadius: 12,
    },
  });

  const warehouse = await prisma.branch.upsert({
    where: { slug: "central-warehouse" },
    update: {},
    create: {
      name: "Central Warehouse",
      slug: "central-warehouse",
      code: "WH-001",
      address: "Industrial Area, Spintex Road",
      city: "Accra",
      state: "Greater Accra",
      phone: "+233 54 477 2485",
      email: "warehouse@jumaraldpharmacy.com",
      isWarehouse: true,
      deliveryRadius: 50,
    },
  });

  console.log("✅ Branches seeded");

  // Seed Medicine Interactions
  const products = await prisma.product.findMany({ take: 20 });
  if (products.length >= 4) {
    const interactions = [
      { productAId: products[0].id, productBId: products[1].id, severity: "MAJOR", description: "May increase risk of gastrointestinal bleeding when taken together.", recommendation: "Take at least 2 hours apart. Consult pharmacist.", reference: "FDA Drug Safety Communication" },
      { productAId: products[0].id, productBId: products[2].id, severity: "MODERATE", description: "May reduce effectiveness of one medication.", recommendation: "Monitor for reduced efficacy. Space doses 4 hours apart." },
      { productAId: products[1].id, productBId: products[3].id, severity: "MINOR", description: "Mild interaction - may cause drowsiness.", recommendation: "Avoid driving after taking both medications." },
    ];

    for (const interaction of interactions) {
      await prisma.medicineInteraction.upsert({
        where: { productAId_productBId: { productAId: interaction.productAId, productBId: interaction.productBId } },
        update: {},
        create: interaction,
      });
    }
    console.log("✅ Medicine interactions seeded");
  }

  // Seed Banners
  const banners = [
    { title: "Free Delivery on Orders Over GHS 200", subtitle: "Use code FREESHIP at checkout", imageUrl: "/banners/free-delivery.jpg", linkUrl: "/shop", position: "hero", sortOrder: 1 },
    { title: "Telehealth Consultations Now Available", subtitle: "Connect with licensed doctors from home", imageUrl: "/banners/telehealth.jpg", linkUrl: "/telehealth", position: "hero", sortOrder: 2 },
    { title: "Vitamin Sale - Up to 30% Off", subtitle: "Stock up on essential vitamins and supplements", imageUrl: "/banners/vitamin-sale.jpg", linkUrl: "/shop?category=vitamins-supplements", position: "hero", sortOrder: 3 },
  ];

  for (const banner of banners) {
    await prisma.banner.create({ data: banner });
  }
  console.log("✅ Banners seeded");

  // Seed FAQs
  const faqs = [
    { question: "How do I place an order?", answer: "Browse our products, add items to your cart, and proceed to checkout. You can pay via Paystack (card, bank transfer, mobile money) or choose cash on delivery.", category: "Orders", sortOrder: 1 },
    { question: "Do I need a prescription for all medicines?", answer: "No. Only prescription medications require a valid prescription from a licensed healthcare provider. You can upload your prescription during checkout.", category: "Prescriptions", sortOrder: 2 },
    { question: "How long does delivery take?", answer: "Standard delivery within Greater Accra takes 2-4 hours. Same-day delivery is available for orders placed before 2 PM.", category: "Delivery", sortOrder: 3 },
    { question: "Can I return medications?", answer: "Unopened, sealed medications can be returned within 7 days. Prescription medications cannot be returned once dispensed.", category: "Returns", sortOrder: 4 },
    { question: "How does the loyalty program work?", answer: "Earn 10 points for every GHS 1 spent. Points can be redeemed for discounts, free delivery, and consultations.", category: "Loyalty", sortOrder: 5 },
    { question: "Is my health information secure?", answer: "Yes. We use enterprise-grade encryption and comply with data protection regulations. Your health data is never shared without your consent.", category: "Privacy", sortOrder: 6 },
    { question: "Can I book a doctor consultation?", answer: "Yes! Navigate to our Telehealth section to browse available doctors and book a video consultation.", category: "Telehealth", sortOrder: 7 },
    { question: "What payment methods do you accept?", answer: "We accept Visa, Mastercard, Mobile Money (MTN, Vodafone, AirtelTigo), bank transfers, and cash on delivery.", category: "Payment", sortOrder: 8 },
  ];

  for (const faq of faqs) {
    await prisma.fAQ.create({ data: faq });
  }
  console.log("✅ FAQs seeded");

  // Seed Testimonials
  const testimonials = [
    { name: "Ama Mensah", role: "Loyal Customer", content: "Jumarald Pharmacy has been my go-to for all health needs. Their delivery is fast and the pharmacists are always helpful.", rating: 5, isApproved: true, sortOrder: 1 },
    { name: "Kofi Asante", role: "Business Owner", content: "The online ordering system is incredibly convenient. I can order my monthly prescriptions and they arrive within hours.", rating: 5, isApproved: true, sortOrder: 2 },
    { name: "Efua Boateng", role: "Mother of Three", content: "Having a reliable pharmacy that delivers to my doorstep is a lifesaver. The telehealth feature is amazing for my family.", rating: 5, isApproved: true, sortOrder: 3 },
    { name: "Dr. Kwame Nkrumah", role: "Healthcare Professional", content: "As a doctor, I appreciate the quality of medications and the professional service Jumarald provides to my patients.", rating: 5, isApproved: true, sortOrder: 4 },
    { name: "Abena Osei", role: "Student", content: "Affordable prices and genuine products. The loyalty program rewards are fantastic - I've saved so much!", rating: 4, isApproved: true, sortOrder: 5 },
  ];

  for (const t of testimonials) {
    await prisma.testimonial.create({ data: t });
  }
  console.log("✅ Testimonials seeded");

  // Seed System Settings
  const settings = [
    { key: "store_name", value: "Jumarald Pharmacy & Wellness" },
    { key: "store_email", value: "info@jumaraldpharmacy.com" },
    { key: "store_phone", value: "+233 54 477 2483" },
    { key: "currency", value: "GHS" },
    { key: "shipping_fee", value: "25" },
    { key: "free_shipping_threshold", value: "200" },
    { key: "loyalty_points_per_cedi", value: "10" },
    { key: "referral_bonus", value: "500" },
    { key: "max_cart_items", value: "50" },
    { key: "prescription_required_message", value: "This item requires a valid prescription. Please upload your prescription before checkout." },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log("✅ System settings seeded");

  console.log("🎉 Enterprise seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
