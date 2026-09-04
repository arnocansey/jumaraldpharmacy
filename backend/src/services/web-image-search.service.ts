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

// Unrelated categories to strictly exclude from pharmacy product results
const BANNED_PATTERNS = [
  /\b(ronaldo|messi|football|soccer|sports|premier league|nba|uefa|fifa)\b/i,
  /\b(politics|politician|lawmaker|parliament|congress|senate|brussels|unicef|election|president)\b/i,
  /\b(celebrity|actor|actress|hollywood|movie|cinema|singer|album|concert)\b/i,
  /\b(car|automotive|toyota|honda|ford|bmw|mercedes|motorcycle|vehicle)\b/i,
  /\b(clip art|clipart|vector|cartoon|anime|meme|wallpaper|coloring page|illustration)\b/i,
  /\b(fashion|bikini|swimsuit|lingerie|nude|shirtless|dress|jewelry|shoes|clothing)\b/i,
  /\b(furniture|kitchen|real estate|hotel|resort|vacation)\b/i,
  /\b(accounting|rachunkowosc|homework|exam|degree|university|resume|curriculum)\b/i,
  /\b(home remedies|home remedy|natural remedies|exercises|yoga|diet plan|fitness)\b/i,
];

// Positive medical & packaging indicator keywords
const MEDICAL_KEYWORDS = [
  "syrup", "tablet", "tablets", "capsule", "capsules", "suspension",
  "injection", "cream", "ointment", "lotion", "drops", "solution", "elixir",
  "bottle", "pack", "packaging", "box", "blister", "strip", "sachet", "ampoule", "vial",
  "mg", "ml", "dosage", "dose", "pharmacy", "chemist", "pharma",
  "pharmaceutical", "pharmaceuticals", "medicine", "medicines",
  "medication", "medications", "drug", "drugs", "rx", "fda",
  "antibiotic", "antimalarial", "analgesic", "paracetamol", "cough", "cold",
  "expectorant", "antihistamine", "antacid", "vitamin", "multivitamin", "suppository", "inhaler",
  "herbal", "mixture", "tincture", "balm", "oil", "liniment", "bitters", "rub", "gel", "jar", "tube"
];

/**
 * Filter out non-medical junk and score authentic pharmaceutical packaging photos
 */
function scoreAndFilterImage(img: WebImageResult, query: string): { keep: boolean; score: number } {
  const rawCombined = `${img.title} ${img.source} ${img.image}`;
  const normalized = rawCombined.toLowerCase().replace(/[\+\-_/]|%20/g, " ");

  // 1. Immediately drop banned / non-pharmaceutical categories
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(normalized)) {
      return { keep: false, score: -100 };
    }
  }

  // 2. Query words matching (brand / drug name)
  const queryWords = query
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["medicine", "packaging", "photo", "pharmacy"].includes(w));

  let brandMatched = false;
  let wordScore = 0;
  for (const w of queryWords) {
    if (normalized.includes(w)) {
      wordScore += 25;
      brandMatched = true;
    }
  }

  // 3. Medical keyword matching
  let medicalScore = 0;
  for (const med of MEDICAL_KEYWORDS) {
    if (normalized.includes(med)) {
      medicalScore += 10;
    }
  }

  // 4. Pharmacy / Medical domain bonus
  let domainScore = 0;
  if (/pharmacy|chemist|pharma|drug|health|med|rx|clinic|hospital|bedita|scab|beybee|vafy|swiftmedcare|countrymedical|caplet|phyto-riker/i.test(img.source)) {
    domainScore += 40;
  }

  // Strict gating:
  // Must match either the brand/product name OR have a pharmacy domain + medical context
  if (!brandMatched && domainScore === 0) {
    return { keep: false, score: -50 };
  }

  if (medicalScore === 0 && domainScore === 0) {
    return { keep: false, score: -50 };
  }

  const totalScore = wordScore + medicalScore + domainScore;
  return { keep: totalScore >= 20, score: totalScore };
}

/**
 * Clean and normalize search query terms to maximize image search hits
 */
export function cleanSearchQuery(raw: string): string {
  return raw
    .replace(/\bcoough\b/gi, "cough") // fix common user typo
    .replace(/\bparacetemol\b/gi, "paracetamol")
    .replace(/\(.*?\)/g, " ") // remove (GIHOC) or parenthetical annotations
    .replace(/&/g, " ")
    .replace(/\b(ltd|limited|pharmaceuticals|pharma|inc|corp|plc|llc|centre|center|research|dependable|agency|distributors|distributor|enterprises|enterprise|supplies|supply|holdings|company|co|ventures|venture|ghana)\b/gi, " ")
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
      ? params.manufacturer
          .replace(/\(.*?\)/g, "")
          .replace(/&/g, " ")
          .replace(/\b(ltd|limited|pharmaceuticals|pharma|inc|corp|plc|llc|centre|center|research|dependable|agency|distributors|distributor|enterprises|enterprise|supplies|supply|holdings|company|co|ventures|venture|ghana)\b/gi, "")
          .trim()
      : "";
    const parts = [
      params.name,
      params.strength,
      params.dosageForm,
      cleanMfg,
    ].filter(Boolean);
    query = parts.join(" ");
  }

  const cleanQ = cleanSearchQuery(query);
  console.log(`[WebImageSearch] Searching for cleanQ="${cleanQ}" (raw="${query}")`);

  // 1. Check Serper.dev Google Images API if configured (Zero scraping, 100% cloud reliability)
  if (process.env.SERPER_API_KEY) {
    try {
      const serperResults = await searchSerperImages(cleanQ);
      if (serperResults.length > 0) {
        console.log(`[WebImageSearch] Serper API returned ${serperResults.length} photos`);
        return serperResults.slice(0, 32);
      }
    } catch (err: any) {
      console.warn("[WebImageSearch] Serper API error:", err?.message);
    }
  }

  // 2. Check Google Custom Search API if configured
  if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_CX) {
    try {
      const googleResults = await searchGoogleImages(cleanQ);
      const filteredGoogle = googleResults.filter((it) => scoreAndFilterImage(it, cleanQ).keep);
      if (filteredGoogle.length > 0) {
        console.log(`[WebImageSearch] Google Custom Search returned ${filteredGoogle.length} photos`);
        return filteredGoogle.slice(0, 24);
      }
    } catch (err: any) {
      console.warn("[WebImageSearch] Google Custom Search error:", err?.message);
    }
  }

  // 3. Search natural product query directly
  const hasForm = /\b(ointment|syrup|cream|tablet|tablets|capsule|capsules|suspension|drops|lotion|balm|mixture|gel|injection|spray|inhaler|oil)\b/i.test(cleanQ);
  const searchEngineQuery = hasForm ? cleanQ : `${cleanQ} medicine`;

  const [bingRes, ddgRes] = await Promise.allSettled([
    searchBingImages(searchEngineQuery),
    searchDuckDuckGoImages(searchEngineQuery),
  ]);

  const bingList = bingRes.status === "fulfilled" ? bingRes.value : [];
  const ddgList = ddgRes.status === "fulfilled" ? ddgRes.value : [];
  console.log(`[WebImageSearch] Raw hits: Bing=${bingList.length}, DDG=${ddgList.length}`);

  // Interleave Bing & DuckDuckGo results
  const rawCombined: WebImageResult[] = [];
  const maxLen = Math.max(bingList.length, ddgList.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < bingList.length) rawCombined.push(bingList[i]);
    if (i < ddgList.length) rawCombined.push(ddgList[i]);
  }

  // Filter and score medical relevance
  const seenUrls = new Set<string>();
  const scoredItems: { item: WebImageResult; score: number }[] = [];

  for (const it of rawCombined) {
    if (!it.image || seenUrls.has(it.image)) continue;
    seenUrls.add(it.image);

    const { keep, score } = scoreAndFilterImage(it, cleanQ);
    if (keep) {
      scoredItems.push({ item: it, score });
    }
  }

  scoredItems.sort((a, b) => b.score - a.score);
  const relevantResults = scoredItems.map((s) => s.item);

  if (relevantResults.length > 0) {
    console.log(`[WebImageSearch] Returning ${relevantResults.length} scored medical photos for "${cleanQ}"`);
    return relevantResults.slice(0, 32);
  }

  // 4. Retry with concise 2-word brand query if full query returned 0
  const simpleBrand = cleanQ.split(" ").slice(0, 2).join(" ");
  if (simpleBrand && simpleBrand !== searchEngineQuery) {
    console.log(`[WebImageSearch] Retrying with concise brand query: "${simpleBrand}"`);
    try {
      const fallbackBing = await searchBingImages(simpleBrand);
      const fallbackScored = fallbackBing
        .filter((it) => !seenUrls.has(it.image))
        .map((it) => ({ item: it, ...scoreAndFilterImage(it, cleanQ) }))
        .filter((s) => s.keep)
        .sort((a, b) => b.score - a.score)
        .map((s) => s.item);

      if (fallbackScored.length > 0) {
        console.log(`[WebImageSearch] Fallback concise search found ${fallbackScored.length} photos`);
        return fallbackScored.slice(0, 24);
      }
    } catch {
      // ignore
    }
  }

  // 5. Fallback: OpenFDA Drug Database if it's a generic medication
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
 * Serper.dev Google Images Search API (Zero Scraping, Fast, 100% Reliable from any Cloud Host)
 */
async function searchSerperImages(query: string): Promise<WebImageResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch("https://google.serper.dev/images", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: `${query} medicine packaging`, num: 20 }),
    });

    if (!res.ok) {
      console.warn(`[SerperSearch] Serper returned HTTP ${res.status}`);
      return [];
    }

    const data: any = await res.json();
    const images = data?.images || [];

    return images.map((it: any) => ({
      title: it.title || query,
      image: it.imageUrl,
      thumbnail: it.thumbnailUrl || it.imageUrl,
      source: it.source || it.domain || "Google Images",
    }));
  } catch (err: any) {
    console.warn("[SerperSearch] Error:", err?.message);
    return [];
  }
}

/**
 * Bing Image Search implementation (Fast, Reliable on Cloud Datacenter IPs, No API Key Required)
 */
async function searchBingImages(query: string): Promise<WebImageResult[]> {
  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1&setmkt=en-US&setlang=en&cc=US`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Cookie: "SRCHHPGUSR=ADLT=OFF&NRSLT=50; _EDGE_S=mkt=en-US; MUID=3B6A2D1F5E8B6C0D2F4E3A1B5C7D9E0F",
        Referer: "https://www.bing.com/",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.warn(`[BingSearch] Bing returned HTTP ${res.status} for query="${query}"`);
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
    console.warn("[BingSearch] Bing image search error:", err?.message);
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
      signal: AbortSignal.timeout(6000),
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
      signal: AbortSignal.timeout(8000),
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
