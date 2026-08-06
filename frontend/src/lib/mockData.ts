export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  brand: string;
  requiresPrescription: boolean;
  dosageForm: string;
  strength: string;
  activeIngredients: string;
  usageInstructions: string;
  sideEffects: string;
  warnings: string;
  stockQuantity: number;
  rating: number;
  reviewCount: number;
  images: string[];
  isFeatured?: boolean;
  isBestSeller?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  itemCount: number;
  imageUrl?: string;
  description?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  qualification: string;
  experience: string;
  rating: number;
  consultFee: number;
  avatarUrl: string;
  nextAvailable: string;
}

export const MOCK_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Prescription Medicines", slug: "prescription-medicines", iconName: "Pill", itemCount: 1420, imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80", description: "FDA Ghana certified prescription pharmaceuticals and biologicals." },
  { id: "cat-2", name: "Over The Counter (OTC)", slug: "over-the-counter", iconName: "Stethoscope", itemCount: 850, imageUrl: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=800&q=80", description: "Everyday pain relief, flu care, and digestive health remedies." },
  { id: "cat-3", name: "Vitamins & Supplements", slug: "vitamins-supplements", iconName: "Sparkles", itemCount: 620, imageUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&q=80", description: "Immune support, multivitamin complexes, and wellness formulas." },
  { id: "cat-4", name: "Diabetic & Condition Care", slug: "diabetic-care", iconName: "Activity", itemCount: 340, imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80", description: "Blood glucose meters, test strips, lancets, and insulin care." },
  { id: "cat-5", name: "Personal Care & Local Soaps", slug: "personal-care", iconName: "Heart", itemCount: 490, imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80", description: "Dermatologist approved cleansers, herbal SIBI soaps, and lotions." },
  { id: "cat-6", name: "Baby & Maternal Care", slug: "baby-maternal", iconName: "Smile", itemCount: 310, imageUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&q=80", description: "Pediatric nutrition, mother care, and sensitive skin essentials." },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod-sd-strip",
    name: "SD Codefree Glucose Test Strips (50 Strips)",
    slug: "sd-codefree-glucose-test-strips",
    sku: "JUM-SD-STR",
    description: "High accuracy replacement test strips for SD Codefree blood glucose monitors.",
    price: 221.00,
    compareAtPrice: 245.00,
    category: "diabetic-care",
    brand: "SD Biosensor",
    requiresPrescription: false,
    dosageForm: "Diagnostic Strip",
    strength: "50 Strips",
    activeIngredients: "Glucose Oxidase Sensor",
    usageInstructions: "Insert strip into SD Codefree meter, apply small capillary blood droplet.",
    sideEffects: "None.",
    warnings: "Store in original vial at 2°C–30°C. Close cap immediately after taking a strip.",
    stockQuantity: 120,
    rating: 4.9,
    reviewCount: 88,
    images: ["https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80"],
    isFeatured: true,
    isBestSeller: true,
  },
  {
    id: "prod-sd-meter",
    name: "SD Codefree Blood Glucose Meter Kit",
    slug: "sd-codefree-blood-glucose-meter",
    sku: "JUM-SD-MTR",
    description: "Fast 5-second blood glucose measurement kit with lancing device and carrying pouch.",
    price: 205.54,
    compareAtPrice: 230.00,
    category: "diabetic-care",
    brand: "SD Biosensor",
    requiresPrescription: false,
    dosageForm: "Electronic Meter",
    strength: "Kit",
    activeIngredients: "Biosensor Diagnostic",
    usageInstructions: "Prick fingertip with sterile lancet and touch blood to test strip tip.",
    sideEffects: "None.",
    warnings: "Keep dry and replace batteries when low battery indicator appears.",
    stockQuantity: 45,
    rating: 4.8,
    reviewCount: 64,
    images: ["https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80"],
    isFeatured: true,
  },
  {
    id: "prod-onetouch-meter",
    name: "OneTouch Select Plus Glucose Meter System",
    slug: "onetouch-select-plus-glucose-meter",
    sku: "JUM-OT-MTR",
    description: "3-color 3-range indicator technology that instantly shows if your reading is low, in-range, or high.",
    price: 789.00,
    compareAtPrice: 850.00,
    category: "diabetic-care",
    brand: "LifeScan",
    requiresPrescription: false,
    dosageForm: "Electronic Meter System",
    strength: "Kit",
    activeIngredients: "ColorSure Technology Sensor",
    usageInstructions: "Apply blood sample to OneTouch Select Plus test strip inserted in meter.",
    sideEffects: "None.",
    warnings: "Read user guide before first testing.",
    stockQuantity: 30,
    rating: 5.0,
    reviewCount: 41,
    images: ["https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80"],
    isFeatured: true,
    isBestSeller: true,
  },
  {
    id: "prod-sibi-soap",
    name: "SIBI Natural Ghanaian Herbal Beauty Soap",
    slug: "sibi-soap",
    sku: "JUM-SIB-SOP",
    description: "Authentic Ghanaian natural herbal black soap enriched with shea butter and botanical oils for smooth skin.",
    price: 25.00,
    compareAtPrice: 30.00,
    category: "personal-care",
    brand: "SIBI Care Ghana",
    requiresPrescription: false,
    dosageForm: "Solid Soap Bar",
    strength: "150g",
    activeIngredients: "Raw Shea Butter, Palm Kernel Oil, Cocoa Pod Ash",
    usageInstructions: "Lather with warm water on face and body during daily bath.",
    sideEffects: "Gentle on skin.",
    warnings: "Rinse well if product enters eyes.",
    stockQuantity: 200,
    rating: 4.9,
    reviewCount: 152,
    images: ["https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80"],
    isFeatured: true,
    isBestSeller: true,
  },
  {
    id: "prod-1",
    name: "Amoxicillin & Clavulanate Potassium 625mg",
    slug: "amoxicillin-clavulanate-625mg",
    sku: "JUM-AMX-625",
    description: "Broad-spectrum antibacterial therapy for respiratory tract infections, sinusitis, and otitis media.",
    price: 65.00,
    compareAtPrice: 75.00,
    category: "prescription-medicines",
    brand: "GSK Pharmaceuticals",
    requiresPrescription: true,
    dosageForm: "Tablet",
    strength: "625mg",
    activeIngredients: "Amoxicillin Trihydrate (500mg), Potassium Clavulanate (125mg)",
    usageInstructions: "Take 1 tablet every 12 hours with meals as directed by your physician.",
    sideEffects: "Mild nausea, diarrhea, skin rash, abdominal discomfort.",
    warnings: "Contraindicated in patients with severe penicillin hypersensitivity.",
    stockQuantity: 45,
    rating: 4.9,
    reviewCount: 128,
    images: ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80"],
    isFeatured: true,
    isBestSeller: true,
  },
  {
    id: "prod-2",
    name: "Panadol Extra Advanced Pain Relief",
    slug: "panadol-extra-advanced",
    sku: "JUM-PAN-EX",
    description: "Fast-acting double action relief for tough headaches, toothaches, joint pain, and fever.",
    price: 25.00,
    compareAtPrice: 30.00,
    category: "over-the-counter",
    brand: "Haleon Ghana",
    requiresPrescription: false,
    dosageForm: "Caplet",
    strength: "500mg / 65mg",
    activeIngredients: "Paracetamol (500mg), Caffeine (65mg)",
    usageInstructions: "Take 2 caplets every 4-6 hours as needed. Do not exceed 8 caplets in 24 hours.",
    sideEffects: "Restlessness or insomnia if taken close to bedtime due to caffeine content.",
    warnings: "Do not take with other paracetamol-containing products.",
    stockQuantity: 150,
    rating: 4.8,
    reviewCount: 340,
    images: ["https://images.unsplash.com/photo-1550572017-edd951b55104?w=800&q=80"],
    isFeatured: true,
    isBestSeller: true,
  },
  {
    id: "prod-3",
    name: "Liposomal Vitamin C 1000mg Super Immunity Booster",
    slug: "liposomal-vitamin-c-1000mg",
    sku: "JUM-VIT-C1K",
    description: "High-absorption antioxidant formula supporting immune cellular defense and collagen synthesis.",
    price: 180.00,
    compareAtPrice: 210.00,
    category: "vitamins-supplements",
    brand: "NutraHealth Global",
    requiresPrescription: false,
    dosageForm: "Softgel",
    strength: "1000mg",
    activeIngredients: "Pure Liposomal Ascorbic Acid, Sunflower Lecithin",
    usageInstructions: "Take 1 softgel daily with water before food.",
    sideEffects: "Generally well tolerated. Mild stomach upset at high doses.",
    warnings: "Keep out of reach of children. Store in a cool dry place.",
    stockQuantity: 80,
    rating: 4.9,
    reviewCount: 89,
    images: ["https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&q=80"],
    isFeatured: true,
  },
];

export const PHARMACY_CREDENTIALS = {
  superintendentPharmacist: "Pharm. Philip Bruce-Tagoe",
  registrationNo: "RC Pharm | GPHC Reg. No. 2050984",
  address: "Prampram N-8 Vakpor Street, Behind Yellow House, Greater Accra Region (GN-0019-1625)",
  phone: "+233 54 477 2483",
  altPhone: "+233 30 200 4800",
  email: "care@jumaraldpharmacy.com",
};

export const MOCK_DOCTORS: Doctor[] = [
  {
    id: "doc-1",
    name: "Pharm. Philip Bruce-Tagoe",
    specialty: "Superintendent Pharmacist & Medication Therapy Manager",
    qualification: "PharmD, GPHC Reg. No. 2050984",
    experience: "15 Years Clinical & Retail Pharmacy",
    rating: 4.98,
    consultFee: 150.00,
    avatarUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80",
    nextAvailable: "Today at 2:00 PM",
  },
  {
    id: "doc-2",
    name: "Dr. Kwabena Mensah, MD",
    specialty: "Senior Clinical Pharmacologist & General Physician",
    qualification: "MBChB (UGMS Accra), FWACP, MSc Clinical Therapeutics",
    experience: "14 Years Clinical Practice",
    rating: 4.9,
    consultFee: 180.00,
    avatarUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&q=80",
    nextAvailable: "Today at 3:30 PM",
  },
  {
    id: "doc-3",
    name: "Dr. Akosua Osei-Tutu, PharmD",
    specialty: "Consultant Clinical Pharmacist & Diabetes Care Advisor",
    qualification: "PharmD (KNUST Kumasi), Ghana College of Pharmacists",
    experience: "10 Years Specialty Care",
    rating: 4.95,
    consultFee: 140.00,
    avatarUrl: "https://images.unsplash.com/photo-1594824813566-78853479014a?w=400&q=80",
    nextAvailable: "Tomorrow at 10:00 AM",
  },
];

export const MOCK_FAQS = [
  {
    question: "How do I upload and verify my doctor's prescription?",
    answer: "You can easily upload your prescription by clicking 'Upload Prescription' in our header navigation. Snap a clear photo or upload a PDF. Superintendent Pharmacist Pharm. Philip Bruce-Tagoe and our team verify the prescription within 15–30 minutes.",
  },
  {
    question: "Is delivery fast and temperature-controlled across Ghana?",
    answer: "Yes! Jumarald Pharmacy delivers directly to your doorstep in Greater Accra, Kumasi, Prampram, and across Ghana using cold-chain thermal packaging for insulin and biological medicines.",
  },
  {
    question: "Can I consult a qualified pharmacist or physician online?",
    answer: "Absolutely. Our Telehealth Portal lets you book private video or chat consultations with registered Ghanaian physicians and pharmacists for dosage guidance and disease management.",
  },
  {
    question: "Are all products certified by FDA Ghana?",
    answer: "100% Guaranteed. All pharmaceuticals, diagnostic meters (SD Codefree, OneTouch), and health supplements sold on Jumarald Pharmacy are fully registered with Food and Drugs Authority (FDA) Ghana.",
  },
];
