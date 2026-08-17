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

export const MOCK_DOCTORS: Doctor[] = [];

export const MOCK_FAQS = [
  {
    question: "How do I upload and verify my doctor's prescription?",
    answer: "You can easily upload your prescription by clicking 'Upload Prescription' in our header navigation. Snap a clear photo or upload a PDF. Superintendent Pharmacist Pharm. Philip Bruce-Tagoe and our clinical team verify the prescription promptly during operating hours (typically within 1–2 hours).",
  },
  {
    question: "Is delivery fast and temperature-controlled across Ghana?",
    answer: "Yes! Jumarald Pharmacy delivers directly to your doorstep in Greater Accra, Kumasi, Prampram, and across Ghana using cold-chain thermal packaging for insulin and biological medicines.",
  },
  {
    question: "Can I consult a qualified pharmacist or physician online?",
    answer: "Absolutely. Our Telehealth Portal lets you connect directly with our Superintendent Pharmacist and licensed medical practitioners for medication guidance and disease management.",
  },
  {
    question: "Are all products certified by FDA Ghana?",
    answer: "100% Guaranteed. All pharmaceuticals, diagnostic meters (SD Codefree, OneTouch), and health supplements sold on Jumarald Pharmacy are fully registered with Food and Drugs Authority (FDA) Ghana.",
  },
];
