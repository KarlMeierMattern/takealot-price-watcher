# Yaber K3 price watcher

Daily price checker for the [Yaber K3 Premier Projector](https://www.takealot.com/yaber-k3-premier-projector-with-jbl-sound/PLID97514813) across three South African retailers:

| Retailer | Link |
|----------|------|
| Takealot | [PLID97514813](https://www.takealot.com/yaber-k3-premier-projector-with-jbl-sound/PLID97514813) |
| Amazon SA | [B0DBLBW268](https://www.amazon.co.za/dp/B0DBLBW268) |
| Geewiz | Search or direct URL (see below) |

You get a Resend email when the price drops on any of them.

## Setup

```bash
cd takealot-price-watcher
npm install
cp .env.example .env
# Edit .env with your Resend API key and email addresses
```

### Resend

1. Create an API key at [resend.com/api-keys](https://resend.com/api-keys).
2. For testing, use `onboarding@resend.dev` as the sender and your own email as the recipient.
3. For production, verify a domain at [resend.com/domains](https://resend.com/domains) and use that in `EMAIL_FROM`.

### Geewiz

Geewiz blocks many automated requests (including GitHub Actions). It works best when you run the checker from your Mac on a home connection.

If the Yaber K3 is not found by search, paste the product page URL into `.env`:

```
GEEWIZ_PRODUCT_URL=https://www.geewiz.co.za/.../yaber-k3....html
```

## Run manually

```bash
npm run check          # check all retailers, alert on drops, save state
npm run check:dry      # same but no email and no state write
```

The first run for each retailer records a baseline price and sends no alert. After that, any price drop triggers an email tagged with the retailer name.

Optional: set `TARGET_PRICE=7500` in `.env` to also get an email when a retailer hits that price or below.

## Daily schedule

### Option A — GitHub Actions (Takealot + Amazon)

Push to GitHub and add secrets: `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_TO`, optional `TARGET_PRICE`.

The workflow runs daily at 08:00 SAST. Geewiz may be skipped there because of bot protection — use local cron for full coverage.

### Option B — macOS cron (all three retailers)

```bash
crontab -e
```

```
0 8 * * * cd /Users/alexander/code/projects/takealot-price-watcher && npm run check >> /tmp/takealot-price-watcher.log 2>&1
```

## How it works

- **Takealot** — public product API (price + stock)
- **Amazon SA** — product page HTML (price when listed; currently often unavailable with no price)
- **Geewiz** — product page HTML, or search then first Yaber K3 match

State is stored per retailer in `data/price-state.json`.
