import type { RetailerConfig } from "./types.js";

export const PRODUCT_NAME = "Yaber K3 Premier Projector with JBL Sound";

export const RETAILERS: Record<
  "takealot" | "amazon" | "geewiz",
  RetailerConfig
> = {
  takealot: {
    id: "takealot",
    name: "Takealot",
    url: "https://www.takealot.com/yaber-k3-premier-projector-with-jbl-sound/PLID97514813",
  },
  amazon: {
    id: "amazon",
    name: "Amazon South Africa",
    url: "https://www.amazon.co.za/dp/B0DBLBW268",
  },
  geewiz: {
    id: "geewiz",
    name: "Geewiz",
    url:
      process.env.GEEWIZ_PRODUCT_URL?.trim() ||
      "https://www.geewiz.co.za/index.php?route=product/search&search=Yaber+K3+Premier",
  },
};

export const TAKEALOT_PLID = "PLID97514813";
export const AMAZON_ASIN = "B0DBLBW268";
