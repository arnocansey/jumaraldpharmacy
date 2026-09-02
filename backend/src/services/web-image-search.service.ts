import { cloudinary } from "../config/cloudinary";
import { env } from "../config/env";

export interface WebImageResult {
  title: string;
  image: string;
  thumbnail: string;
  source: string;
  width?: number;
  height?: number;
}

export interface WebImageSearchParams {
  q?: string;
  name?: string;
  manufacturer?: string;
  strength?: string;
  dosageForm?: string;
}

/**
 * Search the web for authentic medicine packaging photos
 */
export async function searchWebProductImages(params: WebImageSearchParams): Promise<WebImageResult[]> {
  let query = params.q?.trim() || "";

  if (!query) {
    const parts = [
      params.name,
      params.strength,
      params.dosageForm,
      params.manufacturer,
      "medicine packaging",
    ].filter(Boolean);
    query = parts.join(" ");
  }

  const results: WebImageResult[] = [];

  // 1. Primary: DuckDuckGo Images Search (No API Key Required, Fast, High Res)
  try {
    const ddgResults = await searchDuckDuckGoImages(query);
    if (ddgResults && ddgResults.length > 0) {
      return ddgResults.slice(0, 16);
    }
  } catch (err: any) {
    console.warn("DuckDuckGo image search failed, trying fallback:", err?.message);
  }

  // 2. Fallback: Google Custom Search API if configured
  if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_CX) {
    try {
      const googleResults = await searchGoogleImages(query);
      if (googleResults.length > 0) {
        return googleResults.slice(0, 16);
      }
    } catch (err: any) {
      console.warn("Google image search error:", err?.message);
    }
  }

  // 3. Fallback: OpenFDA Drug Database if it's a generic medication
  if (params.name) {
    try {
      const fdaResults = await searchOpenFdaImages(params.name);
      if (fdaResults.length > 0) {
        return fdaResults;
      }
    } catch (err) {
      // Ignore openFDA error
    }
  }

  return results;
}

/**
 * DuckDuckGo Image Search implementation
 */
async function searchDuckDuckGoImages(query: string): Promise<WebImageResult[]> {
  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  // Step A: Get VQD token from search page
  const tokenUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
  const tokenRes = await fetch(tokenUrl, {
    headers: {
      "User-Agent": userAgent,
      Accept: "text/html,application/xhtml+xml,application/xml",
    },
  });

  const tokenHtml = await tokenRes.text();
  const vqdMatch =
    tokenHtml.match(/vqd=([0-9-]+)/) ||
    tokenHtml.match(/vqd="([^"]+)"/) ||
    tokenHtml.match(/vqd='([^']+)'/);

  if (!vqdMatch) {
    return [];
  }

  const vqd = vqdMatch[1];

  // Step B: Query DuckDuckGo JSON image endpoint
  const imgUrl = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,`;
  const imgRes = await fetch(imgUrl, {
    headers: {
      "User-Agent": userAgent,
      Accept: "application/json, text/javascript, */*",
      Referer: "https://duckduckgo.com/",
    },
  });

  if (!imgRes.ok) {
    return [];
  }

  const imgData: any = await imgRes.json();
  const items = imgData?.results || [];

  return items
    .filter((it: any) => it.image && !it.image.endsWith(".svg"))
    .map((it: any) => ({
      title: it.title || query,
      image: it.image,
      thumbnail: it.thumbnail || it.image,
      source: it.source || it.url || "Web",
      width: it.width,
      height: it.height,
    }));
}

/**
 * Google Custom Search Engine Image Search
 */
async function searchGoogleImages(query: string): Promise<WebImageResult[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;
  if (!apiKey || !cx) return [];

  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(
    query
  )}&searchType=image&num=10&safe=active`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const data: any = await res.json();
  const items = data?.items || [];

  return items.map((it: any) => ({
    title: it.title,
    image: it.link,
    thumbnail: it.image?.thumbnailLink || it.link,
    source: it.displayLink || "Google",
    width: it.image?.width,
    height: it.image?.height,
  }));
}

/**
 * OpenFDA / DailyMed NDC label images fallback
 */
async function searchOpenFdaImages(drugName: string): Promise<WebImageResult[]> {
  const clean = encodeURIComponent(drugName.split(" ")[0]);
  const url = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${clean}"&limit=3`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const data: any = await res.json();
  const results: WebImageResult[] = [];

  const labels = data?.results || [];
  for (const label of labels) {
    const spl = label.openfda?.spl_id?.[0];
    const brand = label.openfda?.brand_name?.[0] || drugName;
    if (spl) {
      // DailyMed package photo URL convention
      const img = `https://dailymed.nlm.nih.gov/dailymed/image.cfm?setid=${spl}&name=package-label`;
      results.push({
        title: `${brand} - Official FDA Label`,
        image: img,
        thumbnail: img,
        source: "DailyMed / U.S. FDA",
      });
    }
  }

  return results;
}

/**
 * Download a selected remote web image and upload it to Cloudinary CDN
 * for permanent storage and fast delivery.
 */
export async function saveWebImageToCdn(imageUrl: string, productName: string): Promise<string> {
  // 1. Fetch remote image as buffer with browser headers to avoid hotlink blocks
  let buffer: Buffer | null = null;
  let mimeType = "image/jpeg";

  try {
    const res = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
    });

    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      mimeType = res.headers.get("content-type") || "image/jpeg";
    }
  } catch (err: any) {
    console.warn("Direct buffer fetch failed, trying direct URL for Cloudinary:", err?.message);
  }

  // 2. Upload to Cloudinary CDN
  if (env.CLOUDINARY_CLOUD_NAME) {
    try {
      const sanitizedName = productName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .slice(0, 40);
      const publicId = `jumarald/products/${sanitizedName}-${Date.now()}`;

      if (buffer) {
        const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "jumarald/products",
              public_id: publicId,
              resource_type: "image",
              format: "webp",
              quality: "auto:good",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result as { secure_url: string });
            }
          );
          stream.end(buffer);
        });

        return result.secure_url;
      } else {
        const result = await cloudinary.uploader.upload(imageUrl, {
          public_id: publicId,
          resource_type: "image",
          format: "webp",
          quality: "auto:good",
        });
        return result.secure_url;
      }
    } catch (uploadError: any) {
      console.warn("Cloudinary upload failed for web image, falling back to data URI/direct:", uploadError?.message);
    }
  }

  // 3. Fallback: Base64 data URI if Cloudinary is not configured
  if (buffer) {
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  }

  return imageUrl;
}
