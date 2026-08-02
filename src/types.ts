export type RetailerId = "takealot" | "amazon" | "geewiz";

export interface ProductSnapshot {
  retailer: RetailerId;
  retailerName: string;
  url: string;
  price: number | null;
  prettyPrice: string;
  inStock: boolean;
  stockStatus: string;
  title: string;
  checkedAt: string;
}

export interface RetailerState {
  lastPrice: number | null;
  lastPrettyPrice: string | null;
  lastCheckedAt: string | null;
  lowestSeen: number | null;
  history: Array<{
    price: number | null;
    prettyPrice: string;
    checkedAt: string;
    inStock: boolean;
  }>;
}

export type AllState = Partial<Record<RetailerId, RetailerState>>;

export interface RetailerConfig {
  id: RetailerId;
  name: string;
  url: string;
}
