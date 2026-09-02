import { cloudinary } from "../config/cloudinary";
import { env } from "../config/env";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

export interface ProductImagePromptDetails {
  name: string;
  dosageForm?: string | null;
  strength?: string | null;
  categoryName?: string | null;
  manufacturer?: string | null;
}

/**
 * Build a highly specialized medical e-commerce prompt for DALL-E 3
 */
export function buildPharmaceuticalImagePrompt(details: ProductImagePromptDetails): string {
  const form = (details.dosageForm || "medicine").toLowerCase();
  const strength = details.strength ? ` ${details.strength}` : "";
  const brand = details.manufacturer ? ` manufactured by ${details.manufacturer}` : "";
  const category = details.categoryName ? ` for ${details.categoryName}` : "";

  return `Authentic, clean commercial pharmaceutical product photography of "${details.name}"${strength}${brand}${category}. Realistic modern medicine packaging box with clean pharmaceutical typography, sitting beside a neat blister pack strip of ${form}s or prescription amber/white medicine bottle. Crisp seamless pure white studio background, soft bright commercial studio lighting, high resolution, pharmaceutical e-commerce catalog photo, no people or human hands, no clutter.`;
}

/**
 * Generate a realistic pharmaceutical product photo using OpenAI DALL-E 3
 * and store it permanently on Cloudinary CDN (or return data URI).
 */
export async function generatePharmaceuticalProductPhoto(details: ProductImagePromptDetails): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API Key is not configured. Please set OPENAI_API_KEY in the backend environment.");
  }

  const prompt = buildPharmaceuticalImagePrompt(details);

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL || "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "url",
    }),
  });

  const data: any = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Failed to generate pharmaceutical product image via OpenAI DALL-E 3");
  }

  const rawImageUrl = data?.data?.[0]?.url;
  if (!rawImageUrl) {
    throw new Error("No image URL returned from OpenAI image generation API");
  }

  // 1. Upload to Cloudinary for permanent hosting if Cloudinary is configured
  if (env.CLOUDINARY_CLOUD_NAME) {
    try {
      const sanitizedName = details.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .slice(0, 40);
      const publicId = `jumarald/products/${sanitizedName}-${Date.now()}`;

      const uploadResult = await cloudinary.uploader.upload(rawImageUrl, {
        public_id: publicId,
        overwrite: true,
        resource_type: "image",
        format: "webp",
        quality: "auto:good",
      });

      return uploadResult.secure_url;
    } catch (uploadError: any) {
      console.warn("Cloudinary upload failed for AI generated image, falling back to direct URL / buffer:", uploadError?.message);
    }
  }

  // 2. Fallback: Download image and store as base64 data URI if Cloudinary is not configured
  try {
    const imgRes = await fetch(rawImageUrl);
    if (imgRes.ok) {
      const arrayBuffer = await imgRes.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const contentType = imgRes.headers.get("content-type") || "image/png";
      return `data:${contentType};base64,${base64}`;
    }
  } catch (fetchErr) {
    console.warn("Failed to fetch image buffer, returning direct URL:", fetchErr);
  }

  return rawImageUrl;
}
