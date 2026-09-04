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
 * Attempt to generate pharmaceutical photo via OpenAI (DALL-E 3 or DALL-E 2)
 */
async function generateWithOpenAI(prompt: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const targetModel = process.env.OPENAI_IMAGE_MODEL || "dall-e-3";

  // Tier A: Try requested model (default dall-e-3)
  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: targetModel,
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      }),
      signal: AbortSignal.timeout(30000),
    });

    const data: any = await res.json();
    if (res.ok && data?.data?.[0]?.url) {
      return data.data[0].url;
    }

    const errMessage = data?.error?.message || "";
    console.warn(`[AI Studio] OpenAI ${targetModel} error:`, errMessage);

    // Tier B: If dall-e-3 model does not exist or key lacks dall-e-3 permissions, try dall-e-2
    if (/model.*not exist|dall-e-3/i.test(errMessage) && targetModel !== "dall-e-2") {
      console.log("[AI Studio] Retrying with dall-e-2...");
      const res2 = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-2",
          prompt: prompt.slice(0, 950),
          n: 1,
          size: "1024x1024",
        }),
        signal: AbortSignal.timeout(30000),
      });

      const data2: any = await res2.json();
      if (res2.ok && data2?.data?.[0]?.url) {
        return data2.data[0].url;
      }
      console.warn("[AI Studio] OpenAI dall-e-2 error:", data2?.error?.message);
    }
  } catch (err: any) {
    console.warn("[AI Studio] OpenAI request exception:", err?.message);
  }

  return null;
}

/**
 * Generate commercial pharmaceutical product photo using Flux Studio (Free, Zero API Key Required, 100% Reliable)
 */
async function generateWithFlux(details: ProductImagePromptDetails): Promise<string> {
  const form = (details.dosageForm || "medicine").toLowerCase();
  const strength = details.strength ? ` ${details.strength}` : "";
  const brand = details.manufacturer ? ` by ${details.manufacturer}` : "";

  const prompt = `Authentic clean commercial pharmaceutical packaging photography of "${details.name}"${strength}${brand}. Realistic medicine packaging box with clean medical typography, beside blister pack of ${form}s or prescription bottle. Crisp seamless pure white studio background, commercial lighting, high resolution, product catalog photo, no humans, no text errors.`;

  const seed = Math.floor(Math.random() * 1000000);
  const fluxUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&model=flux&seed=${seed}`;

  console.log("[AI Studio] Generating via Flux Studio AI...");
  const res = await fetch(fluxUrl, { signal: AbortSignal.timeout(25000) });
  if (!res.ok) {
    throw new Error(`Flux generator returned HTTP ${res.status}`);
  }

  return fluxUrl;
}

/**
 * Generate a realistic pharmaceutical product photo using multi-tier AI
 * (DALL-E 3 -> DALL-E 2 -> Flux Studio) and store permanently on Cloudinary CDN.
 */
export async function generatePharmaceuticalProductPhoto(details: ProductImagePromptDetails): Promise<string> {
  const prompt = buildPharmaceuticalImagePrompt(details);

  let rawImageUrl: string | null = null;

  // 1. Try OpenAI if API key is present
  if (process.env.OPENAI_API_KEY) {
    rawImageUrl = await generateWithOpenAI(prompt);
  }

  // 2. Seamlessly fall back to Flux Studio if OpenAI failed or key is unconfigured
  if (!rawImageUrl) {
    console.log("[AI Studio] Using high-performance Flux Studio AI generator...");
    rawImageUrl = await generateWithFlux(details);
  }

  if (!rawImageUrl) {
    throw new Error("Failed to generate pharmaceutical product image from all AI engines");
  }

  // 3. Upload to Cloudinary for permanent hosting if Cloudinary is configured
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

  // 4. Fallback: Download image and store as base64 data URI if Cloudinary is not configured
  if (rawImageUrl.startsWith("data:")) {
    return rawImageUrl;
  }
  try {
    const imgRes = await fetch(rawImageUrl);
    if (imgRes.ok) {
      const arrayBuffer = await imgRes.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const contentType = imgRes.headers.get("content-type") || "image/jpeg";
      return `data:${contentType};base64,${base64}`;
    }
  } catch (fetchErr) {
    console.warn("Failed to fetch image buffer, returning direct URL:", fetchErr);
  }

  return rawImageUrl;
}
