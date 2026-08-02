import type { ProductSnapshot, RetailerId } from "../types.js";
import { fetchAmazonSnapshot } from "./amazon.js";
import { fetchGeewizSnapshot } from "./geewiz.js";
import { fetchTakealotSnapshot } from "./takealot.js";

type RetailerFetcher = () => Promise<ProductSnapshot>;

export const RETAILER_FETCHERS: Record<RetailerId, RetailerFetcher> = {
  takealot: fetchTakealotSnapshot,
  amazon: fetchAmazonSnapshot,
  geewiz: fetchGeewizSnapshot,
};

export const DEFAULT_RETAILER_ORDER: RetailerId[] = [
  "takealot",
  "amazon",
  "geewiz",
];

export function getRetailerOrder(): RetailerId[] {
  const configured = process.env.RETAILERS?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (!configured?.length) {
    return DEFAULT_RETAILER_ORDER;
  }

  return configured.filter(
    (id): id is RetailerId => id in RETAILER_FETCHERS,
  );
}
