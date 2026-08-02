export function formatZar(amount: number): string {
  return `R ${amount.toLocaleString("en-ZA")}`;
}

export function parseZarPrice(raw: string): number | null {
  const match = raw.match(/R\s*([0-9][0-9,]*(?:\.[0-9]{2})?)/i);
  if (!match) return null;

  const value = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}
