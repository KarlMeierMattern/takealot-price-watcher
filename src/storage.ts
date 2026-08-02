import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AllState, ProductSnapshot, RetailerId, RetailerState } from "./types.js";

const DATA_DIR = path.join(process.cwd(), "data");
const STATE_FILE = path.join(DATA_DIR, "price-state.json");

const EMPTY_RETAILER_STATE: RetailerState = {
  lastPrice: null,
  lastPrettyPrice: null,
  lastCheckedAt: null,
  lowestSeen: null,
  history: [],
};

function emptyRetailerState(): RetailerState {
  return {
    ...EMPTY_RETAILER_STATE,
    history: [],
  };
}

function isLegacyState(raw: Record<string, unknown>): boolean {
  return "lastPrice" in raw && !("takealot" in raw) && !("amazon" in raw);
}

function migrateLegacyState(raw: Record<string, unknown>): AllState {
  return {
    takealot: {
      lastPrice: (raw.lastPrice as number | null) ?? null,
      lastPrettyPrice: (raw.lastPrettyPrice as string | null) ?? null,
      lastCheckedAt: (raw.lastCheckedAt as string | null) ?? null,
      lowestSeen: (raw.lowestSeen as number | null) ?? null,
      history: (raw.history as RetailerState["history"]) ?? [],
    },
  };
}

export async function loadState(): Promise<AllState> {
  try {
    const raw = JSON.parse(await readFile(STATE_FILE, "utf8")) as Record<
      string,
      unknown
    >;

    if (isLegacyState(raw)) {
      return migrateLegacyState(raw);
    }

    return raw as AllState;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }
    throw error;
  }
}

export function getRetailerState(
  state: AllState,
  retailer: RetailerId,
): RetailerState {
  return state[retailer] ?? emptyRetailerState();
}

export async function saveRetailerState(
  state: AllState,
  snapshot: ProductSnapshot,
): Promise<AllState> {
  await mkdir(DATA_DIR, { recursive: true });

  const previous = getRetailerState(state, snapshot.retailer);
  const nextRetailerState: RetailerState = {
    ...previous,
    lastPrice: snapshot.price,
    lastPrettyPrice: snapshot.prettyPrice,
    lastCheckedAt: snapshot.checkedAt,
    lowestSeen:
      snapshot.price == null
        ? previous.lowestSeen
        : previous.lowestSeen == null
          ? snapshot.price
          : Math.min(previous.lowestSeen, snapshot.price),
    history: [
      ...previous.history,
      {
        price: snapshot.price,
        prettyPrice: snapshot.prettyPrice,
        checkedAt: snapshot.checkedAt,
        inStock: snapshot.inStock,
      },
    ].slice(-90),
  };

  const next: AllState = {
    ...state,
    [snapshot.retailer]: nextRetailerState,
  };

  await writeFile(STATE_FILE, JSON.stringify(next, null, 2));
  return next;
}

export interface PriceChange {
  previousPrice: number;
  currentPrice: number;
  dropAmount: number;
  dropPercent: number;
}

export function detectPriceDrop(
  state: RetailerState,
  snapshot: ProductSnapshot,
): PriceChange | null {
  if (
    state.lastPrice == null ||
    snapshot.price == null ||
    snapshot.price >= state.lastPrice
  ) {
    return null;
  }

  const dropAmount = state.lastPrice - snapshot.price;
  const dropPercent = (dropAmount / state.lastPrice) * 100;

  return {
    previousPrice: state.lastPrice,
    currentPrice: snapshot.price,
    dropAmount,
    dropPercent,
  };
}

export function hitTargetPrice(
  state: RetailerState,
  snapshot: ProductSnapshot,
  targetPrice: number,
): boolean {
  return (
    snapshot.price != null &&
    snapshot.price <= targetPrice &&
    (state.lastPrice == null || state.lastPrice > targetPrice)
  );
}
