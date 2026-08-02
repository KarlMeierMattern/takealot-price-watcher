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

export const RETAILER_ORDER: RetailerId[] = ["takealot", "amazon", "geewiz"];
