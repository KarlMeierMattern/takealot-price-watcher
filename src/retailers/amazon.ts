import { formatZar, parseZarPrice } from "../format.js";
import { fetchText } from "../http.js";
import { AMAZON_ASIN, PRODUCT_NAME, RETAILERS } from "../products.js";
import type { ProductSnapshot } from "../types.js";

function extractAmazonPrice(html: string): number | null {
  const patterns = [
    /class="a-offscreen">\s*R\s*([0-9][0-9,]*(?:\.[0-9]{2})?)/i,
    /"priceToPay":\{[^}]*"value":([0-9.]+)/,
    /"price":\{[^}]*"value":([0-9.]+)[^}]*"currency":\s*"ZAR"/,
    /class="a-price-whole">([0-9,]+)</,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match) continue;

    const raw = match[1].includes(",") || !match[0].includes('"')
      ? parseZarPrice(`R ${match[1]}`)
      : Number(match[1]);

    if (raw != null && Number.isFinite(raw) && raw > 0) {
      return raw;
    }
  }

  return null;
}

function extractAmazonStock(html: string): {
  inStock: boolean;
  stockStatus: string;
} {
  if (/Currently unavailable|Out of stock|We don't know when/i.test(html)) {
    return { inStock: false, stockStatus: "Currently unavailable" };
  }

  if (/Add to Cart|Add to basket|In stock/i.test(html)) {
    return { inStock: true, stockStatus: "In stock" };
  }

  return { inStock: false, stockStatus: "Unknown" };
}

export async function fetchAmazonSnapshot(): Promise<ProductSnapshot> {
  const url = `https://www.amazon.co.za/dp/${AMAZON_ASIN}`;
  const html = await fetchText(url);

  const title =
    html.match(/id="productTitle"[^>]*>\s*([^<]+)/)?.[1]?.trim() ??
    PRODUCT_NAME;

  const price = extractAmazonPrice(html);
  const stock = extractAmazonStock(html);

  return {
    retailer: "amazon",
    retailerName: RETAILERS.amazon.name,
    url: RETAILERS.amazon.url,
    price,
    prettyPrice: price == null ? "No price listed" : formatZar(price),
    inStock: stock.inStock,
    stockStatus: stock.stockStatus,
    title,
    checkedAt: new Date().toISOString(),
  };
}
