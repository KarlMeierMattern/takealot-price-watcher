import { formatZar } from "../format.js";
import { PRODUCT_NAME, RETAILERS, TAKEALOT_PLID } from "../products.js";
import type { ProductSnapshot } from "../types.js";

export async function fetchTakealotSnapshot(): Promise<ProductSnapshot> {
  const plidStr = TAKEALOT_PLID.toUpperCase();
  const url = `https://api.takealot.com/rest/v-1-10-0/product-details/${plidStr}?platform=desktop`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "takealot-price-watcher/1.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Takealot API returned ${response.status}`);
  }

  const data = (await response.json()) as {
    title?: string;
    buybox?: {
      items?: Array<{
        price?: number;
        pretty_price?: string;
        is_add_to_cart_available?: boolean;
        stock_availability?: { status?: string };
      }>;
    };
  };

  const item = data.buybox?.items?.find((entry) => entry.price != null);
  if (!item?.price) {
    throw new Error("Could not find price in Takealot response");
  }

  const stockStatus = item.stock_availability?.status ?? "Unknown";

  return {
    retailer: "takealot",
    retailerName: RETAILERS.takealot.name,
    url: RETAILERS.takealot.url,
    price: item.price,
    prettyPrice: item.pretty_price ?? formatZar(item.price),
    inStock: item.is_add_to_cart_available === true,
    stockStatus,
    title: data.title ?? PRODUCT_NAME,
    checkedAt: new Date().toISOString(),
  };
}
