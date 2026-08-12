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

export const MOCK_CATEGORIES: Category[] = [];

export const MOCK_PRODUCTS: Product[] = [];

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
