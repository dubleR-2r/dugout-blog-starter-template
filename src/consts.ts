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

// TODO: replace with your live Stripe Payment Link for the Standard tier.
// Stripe Dashboard → Payment Links → create a link → copy the buy.stripe.com URL.
// The signup form appends ?prefilled_email=<email> when redirecting to it.
//
// Until this is a real buy.stripe.com URL the site stays fully publishable:
// the page renders normally, but the signup form switches to "preview mode"
// (see CHECKOUT_READY below) instead of sending anyone to a dead link.
export const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/fZueVf9544gff1jfO3fYY00";

/** True once a real Stripe Payment Link is configured above. */
export const CHECKOUT_READY = !STRIPE_PAYMENT_LINK.includes("REPLACE_ME");

// Stripe customer-portal login link (Stripe Dashboard → Settings → Billing →
// Customer portal → "Share a link"). This is where existing subscribers manage
// or cancel their subscription; canceling here removes them from the send list
// via Scenario B (see docs/stripe-make-subscriber-flow.md §8). Shown in the
// footer. Set to null to hide the "Manage subscription" link.
export const STRIPE_PORTAL_LINK =
	"https://billing.stripe.com/p/login/fZueVf9544gff1jfO3fYY00";

// Shown to visitors in place of checkout while CHECKOUT_READY is false.
export const PREVIEW_NOTICE =
	"Checkout opens soon — subscriptions aren't live on this site yet.";

// Displayed pricing. Keep in sync with the Stripe Payment Link above — these
// strings are cosmetic and do not affect what Stripe actually charges.
export const PLAN_NAME = "Standard";
export const PRICE_AMOUNT = "$4.99";
export const PRICE_INTERVAL = "per month";

// Launch promotion. Set to null to remove the banner and pricing callout.
// The code itself must be created as a promotion code in Stripe.
export const LAUNCH_OFFER = {
	code: "INVESTFEST26",
	text: "Launch offer: first month $1 with code INVESTFEST26",
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
