import { Resend } from "resend";
import { formatZar } from "./format.js";
import { PRODUCT_NAME } from "./products.js";
import type { PriceChange } from "./storage.js";
import type { ProductSnapshot } from "./types.js";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function sendPriceDropEmail(
  snapshot: ProductSnapshot,
  change: PriceChange,
): Promise<void> {
  const resend = new Resend(requireEnv("RESEND_API_KEY"));
  const from = requireEnv("EMAIL_FROM");
  const to = requireEnv("EMAIL_TO");

  const subject = `[${snapshot.retailerName}] Price drop: ${PRODUCT_NAME} now ${snapshot.prettyPrice}`;

  const html = `
    <h2>${snapshot.retailerName} price drop</h2>
    <p><strong>${snapshot.title}</strong></p>
    <ul>
      <li>Was: <strong>${formatZar(change.previousPrice)}</strong></li>
      <li>Now: <strong>${snapshot.prettyPrice}</strong></li>
      <li>You save: <strong>${formatZar(change.dropAmount)}</strong> (${change.dropPercent.toFixed(1)}% off)</li>
      <li>Stock: ${snapshot.inStock ? "In stock" : snapshot.stockStatus}</li>
    </ul>
    <p><a href="${snapshot.url}">View on ${snapshot.retailerName}</a></p>
    <p style="color:#666;font-size:12px;">Checked at ${snapshot.checkedAt}</p>
  `.trim();

  const text = [
    `${snapshot.retailerName}: ${snapshot.title}`,
    `Was ${formatZar(change.previousPrice)} → now ${snapshot.prettyPrice}`,
    `Save ${formatZar(change.dropAmount)} (${change.dropPercent.toFixed(1)}% off)`,
    `Stock: ${snapshot.inStock ? "In stock" : snapshot.stockStatus}`,
    snapshot.url,
  ].join("\n");

  const { error } = await resend.emails.send({ from, to, subject, html, text });

  if (error) {
    throw new Error(`Resend failed: ${error.message}`);
  }
}

export async function sendTargetPriceEmail(
  snapshot: ProductSnapshot,
  targetPrice: number,
): Promise<void> {
  const resend = new Resend(requireEnv("RESEND_API_KEY"));
  const from = requireEnv("EMAIL_FROM");
  const to = requireEnv("EMAIL_TO");

  const subject = `[${snapshot.retailerName}] Target price hit: ${PRODUCT_NAME} at ${snapshot.prettyPrice}`;

  const html = `
    <h2>${snapshot.retailerName}: target price reached</h2>
    <p><strong>${snapshot.title}</strong> is now ${snapshot.prettyPrice}.</p>
    <p>Your target was ${formatZar(targetPrice)} or lower.</p>
    <p>Stock: ${snapshot.inStock ? "In stock" : snapshot.stockStatus}</p>
    <p><a href="${snapshot.url}">View on ${snapshot.retailerName}</a></p>
  `.trim();

  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
    text: `${snapshot.retailerName}: ${snapshot.title} is ${snapshot.prettyPrice} (target ${formatZar(targetPrice)}). ${snapshot.url}`,
  });

  if (error) {
    throw new Error(`Resend failed: ${error.message}`);
  }
}
