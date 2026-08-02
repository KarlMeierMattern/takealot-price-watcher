# Yaber K3 price watcher

Daily price checker for the [Yaber K3 Premier Projector](https://www.takealot.com/yaber-k3-premier-projector-with-jbl-sound/PLID97514813). It runs on **GitHub Actions**, checks Takealot and Amazon South Africa, and emails you via [Resend](https://resend.com) when the price drops.

| Retailer | Link |
|----------|------|
| Takealot | [PLID97514813](https://www.takealot.com/yaber-k3-premier-projector-with-jbl-sound/PLID97514813) |
| Amazon SA | [B0DBLBW268](https://www.amazon.co.za/dp/B0DBLBW268) |

Geewiz is not included — their site blocks GitHub Actions runners.

## Setup

### 1. Resend

1. Create an API key at [resend.com/api-keys](https://resend.com/api-keys).
2. For testing, use `onboarding@resend.dev` as the sender.
3. For production, verify a domain at [resend.com/domains](https://resend.com/domains).

### 2. GitHub secrets

In the repo go to **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Required | Example |
|--------|----------|---------|
| `RESEND_API_KEY` | Yes | `re_...` |
| `EMAIL_FROM` | Yes | `You <alerts@yourdomain.com>` |
| `EMAIL_TO` | Yes | `you@gmail.com` |
| `TARGET_PRICE` | No | `7500` |

### 3. Enable Actions

GitHub → **Actions** → enable workflows if prompted.

The job runs daily at **08:00 SAST** and can also be triggered manually from the Actions tab (**Daily price check → Run workflow**).

## How it works

1. The workflow checks Takealot (API) and Amazon SA (product page).
2. It compares prices against `data/price-state.json` in the repo.
3. On a drop, it sends a Resend email tagged with the retailer name.
4. It commits the updated price history back to the repo.

The first run for each retailer records a baseline and sends no alert.

## Local testing (optional)

```bash
npm install
cp .env.example .env   # fill in values
npm run check:dry      # no email, no state write
npm run check          # sends email and updates data/price-state.json
```
