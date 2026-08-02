import { readFileSync } from "node:fs";
import path from "node:path";
import { sendPriceDropEmail, sendTargetPriceEmail } from "./email.js";
import { PRODUCT_NAME } from "./products.js";
import { getRetailerOrder, RETAILER_FETCHERS } from "./retailers/index.js";
import {
  detectPriceDrop,
  getRetailerState,
  hitTargetPrice,
  loadState,
  saveRetailerState,
} from "./storage.js";
import type { AllState, ProductSnapshot } from "./types.js";

function loadDotEnv(): void {
  try {
    const envPath = path.join(process.cwd(), ".env");
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env is optional when vars are already exported
  }
}

async function checkRetailer(
  state: AllState,
  dryRun: boolean,
  targetPrice: number | null,
): Promise<AllState> {
  for (const retailerId of getRetailerOrder()) {
    const fetchSnapshot = RETAILER_FETCHERS[retailerId];

    console.log(`\n[${retailerId}] Checking ${PRODUCT_NAME}...`);

    let snapshot: ProductSnapshot;
    try {
      snapshot = await fetchSnapshot();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown fetch error";
      console.warn(`[${retailerId}] Skipped: ${message}`);
      continue;
    }

    const retailerState = getRetailerState(state, retailerId);

    console.log(`[${retailerId}] Current price: ${snapshot.prettyPrice}`);
    console.log(
      `[${retailerId}] Stock: ${snapshot.inStock ? "In stock" : snapshot.stockStatus}`,
    );

    if (retailerState.lastPrice != null) {
      console.log(
        `[${retailerId}] Previous price: ${retailerState.lastPrettyPrice ?? retailerState.lastPrice}`,
      );
    } else {
      console.log(`[${retailerId}] First run — recording baseline, no alert.`);
    }

    const priceDrop = detectPriceDrop(retailerState, snapshot);
    const reachedTarget =
      targetPrice != null && hitTargetPrice(retailerState, snapshot, targetPrice);

    if (priceDrop) {
      console.log(
        `[${retailerId}] Price dropped by ${priceDrop.dropAmount} (${priceDrop.dropPercent.toFixed(1)}%)`,
      );

      if (dryRun) {
        console.log(`[${retailerId}] [dry-run] Would send price-drop email.`);
      } else {
        await sendPriceDropEmail(snapshot, priceDrop);
        console.log(`[${retailerId}] Price-drop email sent.`);
      }
    }

    if (reachedTarget) {
      console.log(`[${retailerId}] Target price ${targetPrice} reached.`);

      if (dryRun) {
        console.log(`[${retailerId}] [dry-run] Would send target-price email.`);
      } else if (!priceDrop) {
        await sendTargetPriceEmail(snapshot, targetPrice);
        console.log(`[${retailerId}] Target-price email sent.`);
      }
    }

    if (!dryRun) {
      state = await saveRetailerState(state, snapshot);
    }
  }

  return state;
}

async function main(): Promise<void> {
  loadDotEnv();

  const dryRun = process.argv.includes("--dry-run");
  const targetPrice = process.env.TARGET_PRICE
    ? Number(process.env.TARGET_PRICE)
    : null;

  let state = await loadState();
  state = await checkRetailer(state, dryRun, targetPrice);

  if (!dryRun) {
    console.log("\nState saved.");
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
