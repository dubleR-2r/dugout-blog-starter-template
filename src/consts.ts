// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = "The Weekend Dugout";
export const SITE_TAGLINE = "Intelligence for the AI Supercycle";
export const SITE_DESCRIPTION =
	"Every 8-K, every material disclosure, every headline that matters — filtered, summarized in plain English, and delivered to your inbox.";

export const SITE_URL = "https://theweekenddugout.com";

// Legal entity behind the subscription product.
export const LEGAL_ENTITY = "RJR Trading Strategies LLC";
export const CONTACT_EMAIL = "rjrts@theweekenddugout.com";

// Live Stripe Payment Link for the Standard tier. This link is configured in
// Stripe with a 7-day free trial that requires a card up front (Stripe collects
// email + payment method, charges $0 today, and auto-converts to the plan price
// when the trial ends). The signup form appends ?prefilled_email=<email> when
// redirecting to it. Keep TRIAL_DAYS below in sync with the Stripe setting.
export const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/fZueVf9544gff1jfO3fYY00";

// Length of the free trial configured on the Stripe Payment Link above. Cosmetic
// on the site — Stripe is the source of truth — but keep it matched so the copy
// doesn't lie about how long people have before the first charge.
export const TRIAL_DAYS = 7;

// ── COMING SOON MODE ────────────────────────────────────────────────────────
// Temporary. While true, the site renders normally but NO ONE CAN SIGN UP:
// every subscribe form is disabled server-side (so the Stripe redirect can't
// fire even with JS), and a site-wide banner explains why.
//
// TO RE-ENABLE: set this to true, `npm run build`, `npx wrangler deploy`.
// Nothing else needs touching — every coming-soon change keys off this flag.
export const COMING_SOON = false;

// Banner copy shown site-wide while COMING_SOON is true.
export const COMING_SOON_NOTICE = "Subscriptions open shortly — check back in a few days.";

/**
 * True once a real Stripe Payment Link is configured above AND the site isn't
 * in coming-soon mode. Gates every subscribe form on the site.
 */
export const CHECKOUT_READY =
	!COMING_SOON && !STRIPE_PAYMENT_LINK.includes("REPLACE_ME");

// Stripe customer-portal login link (Stripe Dashboard → Settings → Billing →
// Customer portal → "Share a link"). This is where existing subscribers manage
// or cancel their subscription; canceling here removes them from the send list
// via Scenario B (see docs/stripe-make-subscriber-flow.md §8). Shown in the
// footer. Set to null to hide the "Manage subscription" link.
export const STRIPE_PORTAL_LINK =
	"https://billing.stripe.com/p/login/fZueVf9544gff1jfO3fYY00";

// Shown to visitors in place of checkout while CHECKOUT_READY is false.
export const PREVIEW_NOTICE =
	"Subscriptions aren't open yet — no sign-ups are being taken right now. Check back in a few days.";

// Displayed pricing. Keep in sync with the Stripe Payment Link above — these
// strings are cosmetic and do not affect what Stripe actually charges.
export const PLAN_NAME = "Standard";
export const PRICE_AMOUNT = "$4.99";
export const PRICE_INTERVAL = "per month";

// Real delivery cadence and the exact send days — keep honest and matched to the
// actual Make schedules. The SEC-filings digest and the news brief run on
// DIFFERENT days, so the site must not claim "daily." Update if schedules change.
export const FILINGS_CADENCE = "twice a week (Tuesday and Friday)";
export const NEWS_CADENCE = "three times a week (Monday, Wednesday, and Friday)";

// Short-form cadence for tight spaces (chips, meta).
export const FILINGS_DAYS_SHORT = "Tue & Fri";
export const NEWS_DAYS_SHORT = "Mon · Wed · Fri";

// SEC FILING WATCHLIST — the companies whose every filing the automation scans,
// grouped by role. This is the REAL scan list; keep it matched to the automation
// (ticker + CIK live in the Make scenario). Note: the news brief is NOT limited
// to these names — it is theme-driven; see NEWS_THEMES below.
export const SEC_WATCHLIST = [
	{ role: "Foundry & packaging", tickers: ["TSM", "AMKR"] },
	{ role: "Design IP", tickers: ["ARM"] },
	{ role: "Memory / HBM", tickers: ["MU"] },
	{ role: "Compute & interconnect", tickers: ["NVDA", "AMD", "AVGO"] },
	{ role: "EDA", tickers: ["SNPS", "CDNS"] },
	{ role: "Equipment", tickers: ["ASML"] },
	{ role: "Hyperscalers", tickers: ["META", "MSFT"] },
	{ role: "Portfolio holdings", tickers: ["PLTR", "HOOD"] },
];

// NEWS BRIEFS are organized by THESIS THEME, not by ticker. Any company that
// moves a theme can appear — a utility, a hyperscaler, a pipeline operator — so
// the roster is open-ended by design. Keep in sync with docs/news-brief-module.md.
export const NEWS_THEMES = [
	{ name: "Power constraint", blurb: "Is data-center power the next binding bottleneck?" },
	{ name: "Capex concentration", blurb: "Is the whole stack riding one hyperscaler's spending?" },
	{ name: "HBM pricing", blurb: "Is memory pricing power real, or capped by long-term contracts?" },
	{ name: "Supply vs demand", blurb: "For capacity-constrained suppliers, is revenue output — not true demand?" },
	{ name: "Moat durability", blurb: "Durable monopoly, or a contested market?" },
];

// Launch promotion, layered on top of the free trial: the trial is the headline,
// and this code discounts the FIRST PAID month once the trial converts. Set to
// null to remove the banner and pricing callout. The code itself must exist as a
// promotion code in Stripe, and must be valid to apply after a trial.
export const LAUNCH_OFFER = {
	code: "INVESTFEST26",
	text: "After your free trial, get your first month for $1 with code INVESTFEST26",
	deadline: "available through August 9",
};

// Effective date shown on the Terms of Service and Privacy Policy.
export const EFFECTIVE_DATE = "June 1, 2026";

// Shown wherever AI-generated filing interpretations are displayed. A filing is
// a primary source, so the instruction is "verify against the primary source."
export const AI_DISCLOSURE_FILINGS =
	"Automated summary of SEC filings. Filing interpretations are AI-generated and may contain errors — verify against the primary source before acting. This is not investment advice and reflects no recommendation to buy, sell, or hold any security.";

// Shown wherever AI-generated news summaries are displayed. News is a secondary
// account that can be updated or retracted, so the instruction is to read the
// linked original — not "the primary source." Keep in sync with the email
// footer in docs/news-brief-module.md §7.
export const AI_DISCLOSURE_NEWS =
	"Automated summary of third-party news reporting. Summaries are AI-generated and may contain errors or stale information; the underlying reporting may itself be updated or retracted — read the linked original before acting. This is not investment advice and reflects no recommendation to buy, sell, or hold any security.";
