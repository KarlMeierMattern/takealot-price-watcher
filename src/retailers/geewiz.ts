import { formatZar, parseZarPrice } from "../format.js";
import { fetchText } from "../http.js";
import { PRODUCT_NAME, RETAILERS } from "../products.js";
import type { ProductSnapshot } from "../types.js";

function isSearchPage(url: string): boolean {
  return url.includes("route=product/search");
}

function pickSearchResult(html: string): string | null {
  const links = [...html.matchAll(/href="([^"]+\.html)"/gi)].map((m) => m[1]);

  for (const href of links) {
    const lower = href.toLowerCase();
    if (
      lower.includes("yaber") &&
      (lower.includes("k3") || lower.includes("projector"))
    ) {
      return href.startsWith("http")
        ? href
        : new URL(href, "https://www.geewiz.co.za").toString();
    }
  }

  return null;
}

function extractGeewizPrice(html: string): number | null {
  const patterns = [
    /<h2>\s*R([0-9][0-9,]*(?:\.[0-9]{2})?)\s*incl\.?\s*VAT/i,
    /class="price-new"[^>]*>\s*R([0-9][0-9,]*(?:\.[0-9]{2})?)/i,
    /class="price-normal"[^>]*>\s*R([0-9][0-9,]*(?:\.[0-9]{2})?)/i,
    /product-price[^>]*>\s*R([0-9][0-9,]*(?:\.[0-9]{2})?)/i,
    /R([0-9][0-9,]*(?:\.[0-9]{2})?)\s*incl\.?\s*VAT/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const price = parseZarPrice(`R ${match[1]}`);
      if (price != null) return price;
    }
  }

  return null;
}

function extractGeewizStock(html: string): {
  inStock: boolean;
  stockStatus: string;
} {
  if (/out of stock|sold out|pre-order only/i.test(html)) {
    return { inStock: false, stockStatus: "Out of stock" };
  }

  if (/add to cart|buy now/i.test(html)) {
    return { inStock: true, stockStatus: "In stock" };
  }

  return { inStock: false, stockStatus: "Unknown" };
}

async function fetchGeewizProductPage(url: string): Promise<ProductSnapshot> {
  const html = await fetchText(url);

  const title =
    html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim() ??
    html.match(/<title>([^<|]+)/i)?.[1]?.trim() ??
    PRODUCT_NAME;

  const price = extractGeewizPrice(html);
  const stock = extractGeewizStock(html);

  return {
    retailer: "geewiz",
    retailerName: RETAILERS.geewiz.name,
    url,
    price,
    prettyPrice: price == null ? "No price listed" : formatZar(price),
    inStock: stock.inStock,
    stockStatus: stock.stockStatus,
    title,
    checkedAt: new Date().toISOString(),
  };
}

export async function fetchGeewizSnapshot(): Promise<ProductSnapshot> {
  const configuredUrl = process.env.GEEWIZ_PRODUCT_URL?.trim();

  if (configuredUrl) {
    return fetchGeewizProductPage(configuredUrl);
  }

  const searchUrl = RETAILERS.geewiz.url;
  const searchHtml = await fetchText(searchUrl);
  const productUrl = pickSearchResult(searchHtml);

  if (!productUrl) {
    throw new Error(
      "No Yaber K3 listing found on Geewiz. Set GEEWIZ_PRODUCT_URL in .env if you have a direct link.",
    );
  }

  return fetchGeewizProductPage(productUrl);
}
