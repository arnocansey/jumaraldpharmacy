import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateSkuFromName } from "./scanner.service";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export interface ExtractedInvoiceItem {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  strength?: string;
  dosageForm?: string;
  activeIngredients?: string;
  categoryName?: string;
  description?: string;
  manufacturer?: string;
  quantity: number;
  costPrice?: number;
  price: number;
  batchNumber?: string;
  expiryDate?: string;
  requiresPrescription: boolean;
}

export interface VoiceParsedProduct {
  name: string;
  sku?: string;
  price?: number;
  costPrice?: number;
  stockQuantity?: number;
  strength?: string;
  dosageForm?: string;
  activeIngredients?: string;
  manufacturer?: string;
  categoryName?: string;
  requiresPrescription?: boolean;
}

/**
 * Universal Vision AI helper for invoice OCR (supports OpenAI Vision and Gemini Vision)
 */
async function callInvoiceVisionAI(base64Image: string, mimeType: string, prompt: string): Promise<string> {
  // Strip any data-URL prefix for both images and PDFs
  const cleanBase64 = base64Image.replace(/^data:[^;]+;base64,/, "");
  const isPdf = mimeType === "application/pdf";

  if (OPENAI_API_KEY && !isPdf) {
    // OpenAI Vision does not natively support PDF inline — if PDF, fall through to Gemini
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || "image/jpeg"};base64,${cleanBase64}`,
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });

    const data: any = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || "OpenAI Vision invoice request failed");
    }
    return data.choices?.[0]?.message?.content || "";
  }

  if (genAI) {
    // Gemini 1.5 natively supports application/pdf and all image types via inlineData
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: cleanBase64,
          mimeType: (mimeType || "image/jpeg") as any,
        },
      },
    ]);
    return result.response.text();
  }

  throw new Error("AI is not configured. Please set OPENAI_API_KEY or GEMINI_API_KEY in the backend environment.");
}

/**
 * Universal Text AI helper for voice transcript parsing
 */
async function callVoiceParserAI(prompt: string): Promise<string> {
  if (OPENAI_API_KEY) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });

    const data: any = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || "OpenAI voice parse request failed");
    }
    return data.choices?.[0]?.message?.content || "";
  }

  if (genAI) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  throw new Error("AI is not configured. Please set OPENAI_API_KEY or GEMINI_API_KEY in the backend environment.");
}

/**
 * Parse a wholesaler/distributor invoice, receipt, or packing slip photo using OpenAI Vision or Gemini Vision
 */
export async function parseWholesalerInvoice(
  base64Image: string,
  mimeType: string = "image/jpeg"
): Promise<{ distributor?: string; invoiceNumber?: string; items: ExtractedInvoiceItem[] }> {
  if (!OPENAI_API_KEY && !genAI) {
    throw new Error(
      "AI is not configured. Please set OPENAI_API_KEY or GEMINI_API_KEY in the backend environment to enable invoice parsing."
    );
  }

  const prompt = `You are a clinical pharmacist and optical character recognition (OCR) assistant for Jumarald Pharmacy in Ghana.
Analyze this paper invoice, delivery note, receipt, or packing slip from a pharmaceutical distributor (e.g. Ernest Chemists, Tobinco, Kinapharma, Ayrton, Unichem, etc.).

Extract the distributor name, invoice number, and every single medicine or product listed in the table or line items.
For each item, infer standard clinical details and calculate a suggested retail selling price (typically cost price + 20% to 30% markup if cost price is available).

Return STRICTLY raw valid JSON (no markdown formatting, no \`\`\`json block):
{
  "distributor": "Name of the supplier or distributor (or null if unknown)",
  "invoiceNumber": "Invoice or delivery note number if visible (or null)",
  "items": [
    {
      "name": "Full product name (e.g. Amoxicillin 500mg Capsules)",
      "strength": "Dose strength (e.g. 500mg, 250mg/5ml)",
      "dosageForm": "Tablet, Capsule, Syrup, Suspension, Injection, Cream, Ointment, Drops, etc.",
      "activeIngredients": "Active chemical or generic ingredient",
      "categoryName": "Antibiotics, Pain Relief, Malaria, Cold & Cough, Vitamins & Supplements, Cardiovascular, Gastrointestinal, etc.",
      "description": "Short 1-sentence pharmaceutical description",
      "manufacturer": "Manufacturer if specified, or distributor name",
      "quantity": 10,
      "costPrice": 25.00,
      "price": 32.50,
      "batchNumber": "Batch or lot number if visible",
      "expiryDate": "YYYY-MM-DD format if visible",
      "requiresPrescription": true
    }
  ]
}

RULES:
1. If quantity is in packs, extract total units or packs as quantity. Default quantity to 1 if not readable.
2. If cost price is given, calculate suggested selling price as costPrice * 1.25. If price is given in GHS or other currency, extract as numeric float.
3. If no cost price is visible, provide an estimated realistic Ghanaian retail price in GHS.
4. Ensure items array contains all distinct medications visible on the document.`;

  const rawText = (await callInvoiceVisionAI(base64Image, mimeType, prompt)).replace(/```json|```/g, "").trim();

  try {
    const data = JSON.parse(rawText);
    const items: ExtractedInvoiceItem[] = (data.items || []).map((item: any, idx: number) => {
      const name = item.name || `Medicine Item ${idx + 1}`;
      const strength = item.strength || undefined;
      const dosageForm = item.dosageForm || undefined;
      const sku = generateSkuFromName(name, strength, dosageForm);
      const cost = item.costPrice ? Number(item.costPrice) : undefined;
      const price = item.price ? Number(item.price) : cost ? Math.round(cost * 1.25 * 100) / 100 : 20.0;

      return {
        id: `inv-${Date.now()}-${idx + 1}`,
        name,
        sku,
        barcode: item.barcode || undefined,
        strength,
        dosageForm,
        activeIngredients: item.activeIngredients || undefined,
        categoryName: item.categoryName || "General Pharmaceuticals",
        description: item.description || `Medication: ${name}`,
        manufacturer: item.manufacturer || data.distributor || undefined,
        quantity: Math.max(1, parseInt(item.quantity) || 1),
        costPrice: cost,
        price,
        batchNumber: item.batchNumber || undefined,
        expiryDate: item.expiryDate || undefined,
        requiresPrescription: typeof item.requiresPrescription === "boolean" ? item.requiresPrescription : false,
      };
    });

    return {
      distributor: data.distributor || undefined,
      invoiceNumber: data.invoiceNumber || undefined,
      items,
    };
  } catch (err: any) {
    throw new Error(`Failed to parse invoice JSON: ${err.message}. Response was: ${rawText.slice(0, 150)}`);
  }
}

/**
 * Parse natural voice speech transcript into structured product fields
 */
export async function parseVoiceTranscriptToProduct(transcript: string): Promise<VoiceParsedProduct> {
  if (!OPENAI_API_KEY && !genAI) {
    // Basic regex heuristic fallback if no AI provider is configured
    const clean = transcript.trim();
    const qtyMatch = clean.match(/(\d+)\s*(boxes|packs|bottles|pieces|units|tablets|capsules)?/i);
    const priceMatch = clean.match(/(\d+(?:\.\d+)?)\s*(cedis|ghs|ghana cedis|dollars)?/i);

    return {
      name: clean.split(",")[0] || clean,
      stockQuantity: qtyMatch ? parseInt(qtyMatch[1]) : 10,
      price: priceMatch ? parseFloat(priceMatch[1]) : 20.0,
      requiresPrescription: false,
    };
  }

  const prompt = `You are an AI assistant for Jumarald Pharmacy in Ghana.
A pharmacist dictated the following spoken sentence to add a product to the catalog:
"${transcript}"

Parse the speech into the following structured JSON format:
{
  "name": "Full product name (e.g. Paracetamol 500mg Tablets)",
  "sku": "Concise clean SKU",
  "price": 25.00,
  "costPrice": 18.00,
  "stockQuantity": 50,
  "strength": "e.g. 500mg, 10mg/5ml",
  "dosageForm": "Tablet, Capsule, Syrup, Suspension, Injection, Cream, etc.",
  "activeIngredients": "Active ingredients if inferrable",
  "manufacturer": "Manufacturer or Brand if mentioned (e.g. Ernest Chemists)",
  "categoryName": "Antibiotics, Pain Relief, Malaria, Vitamins & Supplements, etc.",
  "requiresPrescription": true or false
}

Return ONLY raw valid JSON (no markdown backticks, no explanations).`;

  try {
    const rawText = (await callVoiceParserAI(prompt)).replace(/```json|```/g, "").trim();
    const data = JSON.parse(rawText);
    return {
      name: data.name || transcript,
      sku: data.sku || generateSkuFromName(data.name || "MED", data.strength, data.dosageForm),
      price: data.price ? Number(data.price) : undefined,
      costPrice: data.costPrice ? Number(data.costPrice) : undefined,
      stockQuantity: data.stockQuantity ? Number(data.stockQuantity) : 10,
      strength: data.strength || undefined,
      dosageForm: data.dosageForm || undefined,
      activeIngredients: data.activeIngredients || undefined,
      manufacturer: data.manufacturer || undefined,
      categoryName: data.categoryName || "General Pharmaceuticals",
      requiresPrescription: typeof data.requiresPrescription === "boolean" ? data.requiresPrescription : false,
    };
  } catch {
    // Fallback to basic extraction
    return {
      name: transcript,
      stockQuantity: 10,
      price: 20.0,
      requiresPrescription: false,
    };
  }
}
