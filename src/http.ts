export const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-ZA,en;q=0.9",
};

export async function fetchText(
  url: string,
  headers: Record<string, string> = BROWSER_HEADERS,
): Promise<string> {
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  const text = await response.text();
  if (/cloudflare|you have been blocked|attention required/i.test(text)) {
    throw new Error(`Blocked by site protection (${new URL(url).hostname})`);
  }

  return text;
}
