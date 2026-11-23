# VALTIERA website

Next.js App Router marketing site and expression of interest registration flow. Registration data is written server-side to Supabase; Resend sends acknowledgement and internal notification email. The `/admin` area uses an HTTP-only signed cookie and the configured admin secret.

The `/app` routes provide a demo-first social investing prototype: seeded fictional personas, a research feed, Decision Arena polls, simulated prediction positions funded by non-purchasable demo credits, a portfolio ledger, a sample leaderboard, and TradingView charts. Demo credits have no cash value; the app has no deposits, transfers, withdrawals, prizes, or trade execution. Member posts, polls, saved progress, and private prediction balances require the configured Supabase project and the migrations below. The founder-selected Academy video is embedded from its original publisher and credited to Trade with Pat.

## Local setup

1. Install Node.js 20 or later.
2. Copy `.env.example` to `.env.local` and fill in the server credentials.
3. Run the SQL migrations in order in the Supabase SQL editor: `202611190001_registrations.sql`, `202611200002_application_prototype.sql`, `202611200003_remove_virtual_money.sql`, `202611210001_community_messages_research.sql`, then `202611210002_live_demo_platform.sql` and `202611220001_early_access_waitlist.sql`, and `202611220002_repair_allow_registration.sql`. The waitlist table is private under RLS; public registration and exact aggregate counts use server routes with the service-role key, which must remain server-side.
4. Install and start the app:

   ```sh
   npm install
   npm run dev
   ```

5. Open `http://localhost:3000`. Admin is at `/admin`.

`ADMIN_AUTH_SECRET` is the admin sign-in credential and cookie-signing key. Use a long, unique random value; never put it in a `NEXT_PUBLIC_` variable. The admin login endpoint is rate limited in the database. Do not share this secret with administrators over an insecure channel; for multiple admin users, replace this lightweight single-secret gate with Supabase Auth/SSO before launch.

## Environment variables

| Variable | Use |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public project identifier) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key used by browser auth and member features |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase service role key; never expose to browser or commit |
| `RESEND_API_KEY` | Server-only Resend API key |
| `RESEND_FROM_EMAIL` | Verified sender, for example `VALTIERA <hello@your-domain.example>` |
| `ADMIN_EMAIL` | Destination for internal new-registration notifications |
| `ADMIN_AUTH_SECRET` | Strong admin login credential and cookie signing secret |
| `NEXT_PUBLIC_SITE_URL` | Canonical website origin for metadata, e.g. `https://valtiera.com` |

Use Supabase's current publishable key in the anon key variable if your project uses the newer key naming. The service role remains private. No `.env` files other than `.env.example` should be committed.

The Resend `resend.apiKeys.create()` call creates an API key; it does not send mail and it requires an already authorized Resend API key. This project sends registration emails with `resend.emails.send()` using `RESEND_API_KEY`. Create/copy the account key in your Resend account and set it in the server environment; do not paste the `re_xxxxxxxxx` example placeholder into the app.

## Application prototype and market charts

- `/app` opens with sample market prompts, three discussion previews, an active poll, and links into the demo community. Demo personas and their posts, votes, comments, polls, portfolios, and scores are visibly labelled as fictional sample activity. Browser-only demo actions stay in local storage; signed-in member activity uses separate Supabase tables and Row Level Security.
- `/app/polls` provides the Decision Arena, browser demo voting, comments, and signed-in member poll creation/voting. `/app/predictions` provides simulated YES/NO positions with atomic credit allocation and moderator resolution RPCs. Credits are non-purchasable, non-transferable, and have no cash value.
- `/app/portfolio` shows the signed-in user’s private balance, positions, and transactions, or a local browser demo ledger when signed out. Demo persona portfolio snapshots are separate sample data.
- `/app/login` is `/login`; `/register` creates a Supabase Auth account when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are configured. Demo routes contain public sample content and no private member balances. Supabase RLS scopes member records; apply the migrations before testing registered-user features.
- `/app/markets` embeds TradingView Advanced Charts for stocks, crypto, forex, indices, commodities and futures. It includes symbol search, intervals, indicators, drawing tools and date ranges, with provider branding. No API key is required for the embed; market availability and delays depend on TradingView and each exchange.

## Quant historical market data

Run the provider adapter fixture suite with Node.js 22.6 or later: `node --experimental-strip-types --test tests/market-data.test.mjs`. These fixtures exercise parsing, validation, provider denial and fallback, timeout handling, caching, and supported symbol routing; they do not replace a live provider integration test.

The Quant model API now uses one server-only historical-data adapter. Stocks route to Twelve Data first and Alpha Vantage second when each provider key is configured; the four currently supported U.S. tickers are AAPL, NVDA, MSFT and SPY. Crypto stays on Binance first with Twelve Data as an optional fallback for BTC/USD, ETH/USD, SOL/USD and BNB/USD. All model inputs are daily OHLCV bars, normalized and checked for finite values, duplicate dates, positive prices, OHLC relationships, volume, large gaps and extreme one-day changes. Successful results carry source, exchange, interval, requested date range, fetch time, last bar date, cache state and data-quality warnings. Successful historical responses are cached in process for 15 minutes (equities) or 5 minutes (crypto); provider failures are not cached. HTTP 403 is not retried; a configured secondary is tried. Only transient provider 5xx and timeout failures receive one bounded retry. SABR remains unavailable without an options chain and implied-volatility inputs, and does not substitute OHLC prices for an options surface. The ML page’s financial text pipeline remains separate from price history.

Set TWELVE_DATA_API_KEY and ALPHA_VANTAGE_API_KEY as server-only Vercel variables to enable the equity primary/fallback. TWELVE_DATA_API_KEY also enables the optional crypto fallback. No provider keys are committed. Provider plans, exchange entitlements, permitted display and commercial usage depend on the account and applicable provider terms; confirm those rights before production use. Corporate-action adjustment behavior depends on the provider endpoint and plan and is reported as unverified by this adapter. Alpha Vantage full daily history requires a premium entitlement; if unavailable, the adapter reports the provider error and does not synthesize missing bars. The supported feed does not claim licensed Indian exchange data, futures-contract history, indices beyond the listed SPY ETF, or options-chain data.
## Database and privacy

The ordered migrations create registration, member community, poll, prediction, virtual-credit, notification, and Academy tables. Demo persona tables contain only fictional seeded data and are separate from authenticated member records. RLS scopes private balances, positions, learning progress, and member votes to their owner; prediction and poll writes use validated RPCs.

The optional investor organisation type is retained in the registration message with a label. No wallet credentials, deposits, passwords or sensitive financial information are requested.

The Privacy and Terms pages are starter policy text and need review for the operating entity, jurisdictions, actual retention period and real contact addresses before public launch. Replace placeholder contact details and verify the sending domain in Resend.

## Vercel deployment

1. Push this project to a private or public GitHub repository; confirm `.env.local` is ignored.
2. Import the repository into Vercel and select the Next.js framework preset.
3. Create a Supabase project and run all seven SQL migrations in order.
4. Add the environment variables in Vercel Project Settings for Production and Preview as appropriate. Keep service role, Resend and admin secrets server-only.
5. Verify a sending domain in Resend and set `RESEND_FROM_EMAIL`; configure `ADMIN_EMAIL`.
6. Set `NEXT_PUBLIC_SITE_URL` to the production URL, deploy, then connect the VALTIERA domain when available.
7. Exercise the registration flow, check the saved row, both email deliveries, duplicate and honeypot handling, admin sign-in, status update and CSV export from the deployed URL.

## Important implementation notes

- Registration success is shown only after Supabase confirms insertion. Email delivery runs after persistence; a provider email failure is logged server-side and does not misreport a saved form as failed.
- Rate limiting depends on applying the included migration. The SQL uses hashed IP addresses, not raw IP storage.
- `/admin` is protected by an eight-hour, HTTP-only, same-site cookie. Admin API routes check the signed token. Use HTTPS in production and rotate the secret if exposed.
- Demo chart probabilities, seeded vote counts, virtual portfolios, and leaderboard scores are illustrative and are never real-user traction or verified performance. TradingView controls its own quote availability and delay labels. The Academy embeds the Trade with Pat lesson and uses the publisher’s hosted thumbnail.
- The current development environment has no `.env.local` Supabase credentials. Apply the migrations and configure Auth before validating registered-user writes, RLS policies, mail delivery, or moderator market resolution.
- The site uses system-hosted Google Fonts via CSS import. For a fully self-contained deployment, package approved font files locally.



