import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "../lib/prisma";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || "";
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export interface ScannedProductDetails {
  name: string;
  sku: string;
  barcode?: string;
  description: string;
  price?: number;
  compareAtPrice?: number;
  stockQuantity?: number;
  minStockAlert?: number;
  dosageForm?: string;
  strength?: string;
  activeIngredients?: string;
  usageInstructions?: string;
  sideEffects?: string;
  warnings?: string;
  manufacturer?: string;
  categoryName?: string;
  requiresPrescription: boolean;
  images?: string[];
  source: "local_database" | "external_registry" | "ai_vision" | "ai_synthesis";
  existingProductId?: string;
  confidence?: number;
}

/**
 * Standardize SKU generation from name and strength/form
 */
export function generateSkuFromName(name: string, strength?: string, form?: string): string {
  const cleanName = name.replace(/[^a-zA-Z0-9\s]/g, "").trim().split(/\s+/);
  const prefix = cleanName.slice(0, 2).map((w) => w.slice(0, 3).toUpperCase()).join("-");
  const strPart = strength ? `-${strength.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}` : "";
  const formPart = form ? `-${form.slice(0, 3).toUpperCase()}` : "";
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `${prefix || "MED"}${strPart}${formPart || ""}-${randomSuffix}`;
}

/**
 * Look up a product by Barcode / UPC / EAN
 * 1. Checks local database (if already exists)
 * 2. Queries FDA National Drug Code (NDC) Directory API
 * 3. Queries Open Products Facts & Open Food Facts APIs
 * 4. Uses Gemini AI to enrich/synthesize missing clinical details
 */
export async function lookupBarcode(barcode: string): Promise<ScannedProductDetails | null> {
  const cleanBarcode = barcode.trim();
  if (!cleanBarcode) return null;

  // 1. Check local database first
  const existingProduct = await prisma.product.findFirst({
    where: {
      OR: [
        { barcode: cleanBarcode },
        { sku: cleanBarcode },
      ],
    },
    include: { category: true, brand: true },
  });

  if (existingProduct) {
    return {
      name: existingProduct.name,
      sku: existingProduct.sku,
      barcode: existingProduct.barcode || cleanBarcode,
      description: existingProduct.description,
      price: existingProduct.price,
      compareAtPrice: existingProduct.compareAtPrice ?? undefined,
      stockQuantity: existingProduct.stockQuantity,
      minStockAlert: existingProduct.minStockAlert,
      dosageForm: existingProduct.dosageForm ?? undefined,
      strength: existingProduct.strength ?? undefined,
      activeIngredients: existingProduct.activeIngredients ?? undefined,
      usageInstructions: existingProduct.usageInstructions ?? undefined,
      sideEffects: existingProduct.sideEffects ?? undefined,
      warnings: existingProduct.warnings ?? undefined,
      manufacturer: existingProduct.manufacturer || existingProduct.brand?.name || undefined,
      categoryName: existingProduct.category?.name,
      requiresPrescription: existingProduct.requiresPrescription,
      images: existingProduct.images,
      source: "local_database",
      existingProductId: existingProduct.id,
      confidence: 1.0,
    };
  }

  // 2. Query FDA NDC Drug Directory API
  let fdaData: any = null;
  const fdaQueries = [
    `search=packaging.package_ndc:"${encodeURIComponent(cleanBarcode)}"&limit=1`,
    `search=openfda.upc:"${encodeURIComponent(cleanBarcode)}"&limit=1`,
    `search=product_ndc:"${encodeURIComponent(cleanBarcode)}"&limit=1`,
  ];
  for (const q of fdaQueries) {
    try {
      const res = await fetch(`https://api.fda.gov/drug/ndc.json?${q}`, {
        headers: { "User-Agent": "JumaraldPharmacy/1.0" },
      });
      if (res.ok) {
        const json: any = await res.json();
        if (json.results && json.results.length > 0) {
          fdaData = json.results[0];
          break;
        }
      }
    } catch {
      // Continue to next query format
    }
  }

  if (fdaData) {
    const name = fdaData.brand_name || fdaData.generic_name || `Medication (${cleanBarcode})`;
    const activeIngs = Array.isArray(fdaData.active_ingredients)
      ? fdaData.active_ingredients.map((a: any) => `${a.name} ${a.strength || ""}`.trim()).join(", ")
      : fdaData.generic_name || "";
    const manufacturer = fdaData.labeler_name || "";
    const dosageForm = fdaData.dosage_form || "";
    const requiresPrescription = fdaData.product_type === "HUMAN PRESCRIPTION DRUG" || !!fdaData.prescription_status;

    return enrichScannedProductWithAI({
      name,
      sku: generateSkuFromName(name, undefined, dosageForm),
      barcode: cleanBarcode,
      description: `${name} manufactured by ${manufacturer || "licensed pharmaceutical manufacturer"}. Active ingredients: ${activeIngs || "standard pharmaceutical formulation"}.`,
      dosageForm,
      activeIngredients: activeIngs,
      manufacturer,
      categoryName: "Prescription Medicines",
      requiresPrescription,
      source: "external_registry",
      confidence: 0.95,
    });
  }

  // 3. Query Open Products Facts / Open Food Facts
  let openProductData: any = null;
  try {
    const opfUrl = `https://world.openproductsfacts.org/api/v2/product/${encodeURIComponent(cleanBarcode)}.json`;
    const res = await fetch(opfUrl, { headers: { "User-Agent": "JumaraldPharmacy/1.0" } });
    if (res.ok) {
      const json: any = await res.json();
      if (json.status === 1 && json.product) {
        openProductData = json.product;
      }
    }
  } catch {
    // Continue
  }

  if (!openProductData) {
    try {
      const offUrl = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanBarcode)}.json`;
      const res = await fetch(offUrl, { headers: { "User-Agent": "JumaraldPharmacy/1.0" } });
      if (res.ok) {
        const json: any = await res.json();
        if (json.status === 1 && json.product) {
          openProductData = json.product;
        }
      }
    } catch {
      // Continue
    }
  }

  if (openProductData) {
    const name = openProductData.product_name || openProductData.product_name_en || `Product ${cleanBarcode}`;
    const brand = openProductData.brands || "";
    const ingredients = openProductData.ingredients_text || openProductData.ingredients_text_en || "";
    const categories = openProductData.categories ? openProductData.categories.split(",")[0].trim() : "General Pharmacy";
    const imageUrl = openProductData.image_url || openProductData.image_front_url;

    return enrichScannedProductWithAI({
      name,
      sku: generateSkuFromName(name, undefined, undefined),
      barcode: cleanBarcode,
      description: openProductData.generic_name || `${name} by ${brand || "pharmaceutical provider"}.`,
      activeIngredients: ingredients,
      manufacturer: brand,
      categoryName: categories,
      requiresPrescription: false,
      images: imageUrl ? [imageUrl] : [],
      source: "external_registry",
      confidence: 0.85,
    });
  }

  // 4. AI Clinical Synthesis Lookup if barcode not found in open registries
  if (genAI) {
    try {
      return await askGeminiForBarcode(cleanBarcode);
    } catch (err) {
      console.error("Gemini barcode lookup failed:", err);
    }
  }

  // 5. Default fallback scaffold for unrecognized barcode
  return {
    name: "",
    sku: `BAR-${cleanBarcode.slice(-6)}`,
    barcode: cleanBarcode,
    description: "",
    price: 0,
    requiresPrescription: false,
    source: "ai_synthesis",
    confidence: 0.3,
  };
}

/**
 * Ask Gemini to identify or generate a clinical template for a barcode
 */
async function askGeminiForBarcode(barcode: string): Promise<ScannedProductDetails> {
  if (!genAI) throw new Error("Gemini AI is not configured");

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `You are a clinical pharmacist at Jumarald Pharmacy.
A user has scanned the product barcode: "${barcode}".
If you recognize this barcode or GTIN/UPC/EAN, provide the authentic pharmaceutical details.
If the barcode is unfamiliar, provide a structured pharmaceutical draft template suitable for this code.

Return ONLY raw valid JSON (no markdown formatting, no code blocks):
{
  "name": "Product Name (e.g. Paracetamol 500mg Tablets)",
  "sku": "Concise SKU (e.g. PAR-500-TAB)",
  "barcode": "${barcode}",
  "description": "Professional pharmaceutical description",
  "dosageForm": "Tablet, Capsule, Syrup, Suspension, Injection, Cream, Ointment, Drops, etc.",
  "strength": "e.g. 500mg or 100ml",
  "activeIngredients": "Active chemical ingredients",
  "categoryName": "Appropriate category like Pain Relief, Antibiotics, Vitamins & Supplements, etc.",
  "manufacturer": "Manufacturer name if known",
  "usageInstructions": "Standard administration instructions",
  "sideEffects": "Common side effects",
  "warnings": "Key precautions and warnings",
  "requiresPrescription": false
}`;

  const result = await model.generateContent(prompt);
  const rawText = result.response.text().replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(rawText);

  return {
    ...parsed,
    barcode,
    source: "ai_synthesis",
    confidence: 0.7,
  };
}

/**
 * Enrich partial product data with clinical directions, warnings, and dosage form
 */
async function enrichScannedProductWithAI(partial: ScannedProductDetails): Promise<ScannedProductDetails> {
  if (!genAI) return partial;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `You are a pharmacist for Jumarald Pharmacy. Given this product data:
Name: ${partial.name}
Ingredients: ${partial.activeIngredients || "N/A"}
Dosage Form: ${partial.dosageForm || "N/A"}
Manufacturer: ${partial.manufacturer || "N/A"}

Provide full clinical pharmacy fields in valid JSON (no markdown, no backticks):
{
  "description": "Clear 2-sentence product description",
  "dosageForm": "Standard dosage form (Tablet, Capsule, Syrup, Suspension, Injection, Cream, Ointment, Drops, etc.)",
  "strength": "Strength (e.g. 500mg, 10mg/5ml)",
  "activeIngredients": "Active ingredients list",
  "usageInstructions": "Usage and administration guidelines",
  "sideEffects": "Common known side effects",
  "warnings": "Contraindications and cautions",
  "categoryName": "Clinical category (e.g. Antibiotics, Pain Relief, Cough & Cold, Cardiovascular, Diabetes, Gastrointestinal, Skin Care)",
  "requiresPrescription": boolean
}`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().replace(/```json|```/g, "").trim();
    const enriched = JSON.parse(rawText);

    return {
      ...partial,
      description: partial.description || enriched.description,
      dosageForm: partial.dosageForm || enriched.dosageForm,
      strength: partial.strength || enriched.strength,
      activeIngredients: partial.activeIngredients || enriched.activeIngredients,
      usageInstructions: partial.usageInstructions || enriched.usageInstructions,
      sideEffects: partial.sideEffects || enriched.sideEffects,
      warnings: partial.warnings || enriched.warnings,
      categoryName: partial.categoryName || enriched.categoryName,
      requiresPrescription: partial.requiresPrescription ?? enriched.requiresPrescription,
    };
  } catch (err) {
    return partial;
  }
}

/**
 * Scan a medicine packaging image (via Gemini Vision)
 * Extracts all clinical and packaging text: name, SKU, active ingredients,
 * dosage form, strength, manufacturer, instructions, warnings, and barcode if visible.
 */
export async function scanProductPackagingImage(
  base64Image: string,
  mimeType: string = "image/jpeg"
): Promise<ScannedProductDetails> {
  if (!genAI) {
    throw new Error(
      "Gemini AI is not configured. Please set GEMINI_API_KEY in the backend environment to enable visual packaging scans."
    );
  }

  // Clean base64 prefix if present
  const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z]+;base64,/, "");

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are an expert clinical pharmacist and computer vision AI assistant for Jumarald Pharmacy.
Carefully examine this medicine or health product packaging image (box, bottle, label, or blister pack).
Extract all visible and clinically inferred details into the following strict JSON schema:

{
  "name": "Full, accurate commercial name of the medication or product (e.g. Amoxicillin 500mg Capsules)",
  "sku": "A clean, uppercase SKU code based on the product (e.g. AMX-500-CAP)",
  "barcode": "Digits of the barcode if visible on packaging, otherwise null",
  "manufacturer": "Brand or Pharmaceutical Manufacturer (e.g. Ernest Chemists, GSK, Pfizer, Sanofi)",
  "dosageForm": "One of: Tablet, Capsule, Syrup, Suspension, Injection, Cream, Ointment, Drops, Inhaler, Suppository, Patch, Gel, Solution, Powder, Other",
  "strength": "Dose strength (e.g. 500mg, 250mg/5ml, 1%, 10mg)",
  "activeIngredients": "Active chemical or generic pharmaceutical ingredient(s)",
  "categoryName": "Best matching category (e.g. Antibiotics, Pain Relief, Cough & Cold, Cardiovascular, Diabetes, Gastrointestinal, Skin Care, First Aid, Vitamins & Supplements)",
  "description": "Comprehensive, professional product description detailing what the medication treats and its primary function",
  "usageInstructions": "Dosage and administration directions visible or recommended for this medication",
  "sideEffects": "Common known side effects",
  "warnings": "Contraindications, precautions, storage instructions, and warnings",
  "requiresPrescription": true if this is a prescription-only medication (POM), otherwise false
}

CRITICAL RULES:
1. Return ONLY the raw JSON object. Do NOT wrap in markdown \`\`\`json or provide conversational preamble.
2. Read text carefully from the image, correcting any OCR blur if the drug is an established pharmaceutical.
3. If barcode digits are clearly readable on the packaging, include them in "barcode".`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: cleanBase64,
        mimeType: mimeType || "image/jpeg",
      },
    },
  ]);

  const rawText = result.response.text().replace(/```json|```/g, "").trim();

  try {
    const data = JSON.parse(rawText);
    return {
      name: data.name || "Scanned Medication",
      sku: data.sku || generateSkuFromName(data.name || "MED", data.strength, data.dosageForm),
      barcode: data.barcode || undefined,
      description: data.description || `Medication: ${data.name}`,
      dosageForm: data.dosageForm || undefined,
      strength: data.strength || undefined,
      activeIngredients: data.activeIngredients || undefined,
      usageInstructions: data.usageInstructions || undefined,
      sideEffects: data.sideEffects || undefined,
      warnings: data.warnings || undefined,
      manufacturer: data.manufacturer || undefined,
      categoryName: data.categoryName || "General Pharmaceuticals",
      requiresPrescription: typeof data.requiresPrescription === "boolean" ? data.requiresPrescription : false,
      source: "ai_vision",
      confidence: 0.92,
    };
  } catch (err: any) {
    throw new Error(`Failed to parse AI vision response: ${err.message}. Response was: ${rawText.slice(0, 150)}`);
  }
}
