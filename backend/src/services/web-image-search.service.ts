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
 * Clean and normalize search query terms to maximize image search hits
 */
export function cleanSearchQuery(raw: string): string {
  return raw
    .replace(/\(.*?\)/g, " ") // remove (GIHOC) or parenthetical annotations
    .replace(/\b(ltd|limited|pharmaceuticals|pharma|inc|corp|plc|llc)\b/gi, " ") // remove corporate suffixes
    .replace(/[^\w\s'-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Search the web for authentic medicine packaging photos
 */
export async function searchWebProductImages(params: WebImageSearchParams): Promise<WebImageResult[]> {
  let query = params.q?.trim() || "";

  if (!query) {
    const cleanMfg = params.manufacturer
      ? params.manufacturer.replace(/\(.*?\)/g, "").replace(/\b(ltd|limited|pharmaceuticals|pharma|inc|corp|plc|llc)\b/gi, "").trim()
      : "";
    const parts = [
      params.name,
      params.strength,
      params.dosageForm,
      cleanMfg,
      "medicine",
    ].filter(Boolean);
    query = parts.join(" ");
  }

  const cleanQ = cleanSearchQuery(query);

  // 1. Primary: Search Bing and DuckDuckGo in parallel
  const [bingRes, ddgRes] = await Promise.allSettled([
    searchBingImages(cleanQ),
    searchDuckDuckGoImages(cleanQ),
  ]);

  const bingList = bingRes.status === "fulfilled" ? bingRes.value : [];
  const ddgList = ddgRes.status === "fulfilled" ? ddgRes.value : [];

  // Merge and deduplicate by image URL
  const seenUrls = new Set<string>();
  const combined: WebImageResult[] = [];

  // Interleave Bing & DuckDuckGo results for rich diversity
  const maxLen = Math.max(bingList.length, ddgList.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < bingList.length && !seenUrls.has(bingList[i].image)) {
      seenUrls.add(bingList[i].image);
      combined.push(bingList[i]);
    }
    if (i < ddgList.length && !seenUrls.has(ddgList[i].image)) {
      seenUrls.add(ddgList[i].image);
      combined.push(ddgList[i]);
    }
  }

  if (combined.length > 0) {
    return combined.slice(0, 32);
  }

  // 2. Retry with simplified brand query if full query returned 0
  const simpleQuery = cleanQ.split(" ").slice(0, 3).join(" ");
  if (simpleQuery && simpleQuery !== cleanQ) {
    try {
      const fallbackBing = await searchBingImages(simpleQuery);
      if (fallbackBing.length > 0) {
        return fallbackBing.slice(0, 24);
      }
    } catch {
      // ignore
    }
  }

  // 3. Fallback: Google Custom Search API if configured
  if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_CX) {
    try {
      const googleResults = await searchGoogleImages(cleanQ);
      if (googleResults.length > 0) {
        return googleResults.slice(0, 16);
      }
    } catch (err: any) {
      console.warn("Google image search error:", err?.message);
    }
  }

  // 4. Fallback: OpenFDA Drug Database if it's a generic medication
  if (params.name) {
    try {
      const fdaResults = await searchOpenFdaImages(params.name);
      if (fdaResults.length > 0) {
        return fdaResults;
      }
    } catch {
      // Ignore openFDA error
    }
  }

  return [];
}

/**
 * Bing Image Search implementation (Fast, Reliable on Cloud Datacenter IPs, No API Key Required)
 */
async function searchBingImages(query: string): Promise<WebImageResult[]> {
  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.bing.com/",
      },
    });

    if (!res.ok) {
      return [];
    }

    const html = await res.text();
    const regex = /m="?({[^"]*?&quot;murl&quot;:[^"]*?})"?/g;
    let match;
    const results: WebImageResult[] = [];
    const seenUrls = new Set<string>();

    while ((match = regex.exec(html)) !== null) {
      try {
        const jsonStr = match[1].replace(/&quot;/g, '"');
        const data = JSON.parse(jsonStr);
        if (data.murl && !data.murl.endsWith(".svg") && !seenUrls.has(data.murl)) {
          seenUrls.add(data.murl);
          results.push({
            title: data.t || query,
            image: data.murl,
            thumbnail: data.turl || data.murl,
            source: data.purl || "Bing Images",
          });
        }
      } catch {
        // ignore parse error on specific item
      }
    }

    return results;
  } catch (err: any) {
    console.warn("Bing image search error:", err?.message);
    return [];
  }
}

/**
 * DuckDuckGo Image Search implementation
 */
async function searchDuckDuckGoImages(query: string): Promise<WebImageResult[]> {
  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

  try {
    // Step A: Get VQD token from search page
    const tokenUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
    const tokenRes = await fetch(tokenUrl, {
      headers: {
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
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
        source: it.source || it.url || "DuckDuckGo",
        width: it.width,
        height: it.height,
      }));
  } catch (err: any) {
    console.warn("DuckDuckGo image search exception:", err?.message);
    return [];
  }
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
