# Stripe → Make → Subscriber Delivery (paste-ready)

Turns a Stripe payment into a digest subscriber, and a Stripe cancellation into a
removal. List lives in one Google Sheet; delivery stays on Gmail. Sits alongside
`edgar-claude-module.md` — the EDGAR and news-brief send scenarios plug into the
same subscriber list built here.

Scope: designed for ≤100 subscribers on Gmail. Upgrade trigger to an ESP is in §10.

---

## 0. Architecture at a glance

```
PAYMENT                                        DELIVERY (existing scenarios, modified §7)
Stripe Payment Link ($4.99/mo)                 EDGAR digest ──┐
   │  checkout.session.completed                              ├─→ Search Sheet (status=active)
   ▼                                            News brief ───┘        │
[Scenario A] ─→ upsert row (status=active) ──→  Google Sheet  ←────────┘
   ▲                                            "Subscribers"          │
Stripe customer portal                              │                  ▼
   │  customer.subscription.deleted                 │           Gmail: BCC active list
   ▼                                                │
[Scenario B] ─→ update row (status=canceled) ───────┘
```

Three scenarios total: **A** (add on payment), **B** (remove on cancel),
**C** (send to the active list — a small edit to your two existing send scenarios).

---

## 1. Prerequisites (do these once, before building)

1. **Stripe → Customer Portal ON.** Stripe Dashboard → Settings → Billing →
   Customer portal → enable. Allow customers to cancel. This is what makes the
   `customer.subscription.deleted` event fire — and it's your unsubscribe
   mechanism. Copy the portal link; it goes in the email footer (§8).
2. **Stripe API key for Make.** Dashboard → Developers → API keys → create a
   **restricted key** with read on **Events, Customers, Subscriptions**
   (write not needed). You'll paste it when adding the Stripe connection in Make.
3. **Google Sheet.** Create a sheet named `Subscribers` with a header row —
   schema in §2. Keep it in the same Google account as your Gmail module.
4. **Confirm your Gmail type.** Workspace = 2,000 recipients/day; consumer
   gmail.com = 500/day. Affects §7 and §9.

---

## 2. The Subscribers sheet (schema)

Row 1 headers, exactly:

```
email | customer_id | subscription_id | status | subscribed_at | canceled_at
```

- `status` is the field everything keys on: `active` or `canceled`.
- `customer_id` (cus_…) and `subscription_id` (sub_…) are how Scenario B finds
  the right row — the cancel event doesn't include the email.
- Keep canceled rows (don't delete) — audit trail, and it prevents re-adds.

---

## 3. Phase 0 — Manual mode (first ~20 subscribers)

**Use this to launch today without building Scenarios A/B.** Below ~20 people you
can run the list by hand; automate once it's tedious, not before.

**When a payment comes in** (Stripe emails you a receipt, or watch the Stripe
dashboard → Payments):

1. Open the Subscribers sheet, add a row:
   `email` = their checkout email · `status` = `active` · `subscribed_at` = today.
   Leave `customer_id`/`subscription_id` blank (not needed in manual mode).
2. That's it — the send scenario (§7) reads `status=active`, so they're in.

**Two ways to feed Gmail in Phase 0 — pick one:**

- **3a. Sheet-driven (recommended, forward-compatible).** Build Scenario C (§7)
  now. You maintain the sheet by hand; the send auto-BCCs whatever is `active`.
  When you turn on Scenarios A/B later, nothing about the send changes.
- **3b. Hardcoded BCC (simplest, throwaway).** Skip the sheet entirely; type the
  emails straight into the Gmail module's **BCC** field, comma-separated. Fine for
  a handful, but you'll rip it out when you automate. Only choose this if you want
  zero setup for the very first sends.

**Cancellations in manual mode:** when someone cancels (you'll see it in Stripe),
set their row `status` = `canceled`. If using 3b, delete their address from the
BCC field.

> Graduation: once adding rows by hand is annoying (~20 subs), build Scenarios A
> and B below. The sheet and the send scenario stay exactly as they are — you're
> only automating the *writing* of rows.

---

## 4. Scenario A — Onboarding (add on payment)

New scenario. Turns a completed checkout into an `active` row.

```
[1] Stripe: Watch Events   →   [2] Filter   →   [3] Sheets: Search Rows   →   [4] Router
    checkout.session                                match email                  ├─ (found)    → [5a] Update a Row
    .completed                                                                   └─ (not found)→ [5b] Add a Row
                                                                                                  (+ optional [6] Gmail welcome)
```

**[1] Stripe — Watch Events**
- Connection: your restricted-key connection.
- Event types: `checkout.session.completed` (only).
- This auto-creates the webhook in Stripe. Instant trigger.

**[2] Filter** (label: "paid subscription")
- Condition: `Data: Object: Mode` **equal to** `subscription`
- AND `Data: Object: Payment Status` **equal to** `paid`
- Drops any non-subscription or unpaid sessions.

**[3] Google Sheets — Search Rows** (dedupe lookup)
- Spreadsheet: `Subscribers`. Filter: `email` **equal to**
  `{{Data: Object: Customer Details: Email}}`.
- Returns the row (with its Row Number) if this address already exists.

**[4] Router** with two routes, using the Search result count:

**[5a] Update a Row** — route filter: `[3] Total number of bundles` **greater than** `0`
- Row number: `{{3: Row number}}`
- `status` = `active` · `subscribed_at` = `{{now}}` ·
  `customer_id` = `{{Data: Object: Customer}}` ·
  `subscription_id` = `{{Data: Object: Subscription}}`
- (Re-subscribe case: flips an old `canceled` row back to `active`.)

**[5b] Add a Row** — route filter: `[3] Total number of bundles` **equal to** `0`
- `email` = `{{Data: Object: Customer Details: Email}}`
- `customer_id` = `{{Data: Object: Customer}}`
- `subscription_id` = `{{Data: Object: Subscription}}`
- `status` = `active` · `subscribed_at` = `{{now}}` · `canceled_at` = (blank)

**[6] Gmail — Send Email** *(optional welcome)*
- To: `{{Data: Object: Customer Details: Email}}`
- Subject: `Welcome to The Weekend Dugout`
- Body: what to expect + the manage-subscription link (§8). Add after the two
  Add/Update modules if you want it on both routes (or just the 5b route for
  first-timers only).

> Field note: on `checkout.session.completed` the payer's address is
> **Customer Details: Email** — the one they entered / you prefilled. `Customer`
> and `Subscription` are the cus_/sub_ IDs you store for removal.

---

## 5. Scenario B — Cancellation (remove on cancel)

New scenario. Marks the row `canceled` when the subscription actually ends.

```
[1] Stripe: Watch Events            →   [2] Sheets: Search Rows        →   [3] Sheets: Update a Row
    customer.subscription.deleted        match subscription_id              status=canceled, canceled_at=now
```

**[1] Stripe — Watch Events**
- Event types: `customer.subscription.deleted` (only).

**[2] Google Sheets — Search Rows**
- Filter: `subscription_id` **equal to** `{{Data: Object: ID}}`
  (on this event, `Data: Object: ID` is the sub_… id).
- Fallback if blank: match `customer_id` = `{{Data: Object: Customer}}`.

**[3] Google Sheets — Update a Row**
- Row number: `{{2: Row number}}`
- `status` = `canceled` · `canceled_at` = `{{now}}`

> Timing = your ToS §5, for free. Stripe's portal cancels at **period end**
> (`cancel_at_period_end`), so `customer.subscription.deleted` fires when the paid
> period runs out — the reader keeps getting the digest through what they paid for,
> then drops off. No extra logic. (This event also fires after Stripe gives up on
> failed payments, so dunning cleans itself up.)

---

## 6. Getting the Stripe connection into Make

- In any scenario, add a **Stripe** module → **Add connection** → paste the
  restricted API key from §1.2.
- First run of a **Watch Events** trigger: Make asks to create the webhook —
  allow it. You can confirm it later in Stripe → Developers → Webhooks.
- Test each scenario with Stripe **test mode** first (test-mode events flow to the
  same Watch Events module while the connection is in test), then switch the key
  to live.

---

## 7. Scenario C — Send to the active list (edit existing scenarios)

Applies to **both** the EDGAR digest and the news-brief scenarios. In each, the
tail currently ends at a Gmail module with your address typed in. Replace the tail:

```
… existing build (Tools 6 aggregator → digest body)
        │
        ▼
[+1] Google Sheets: Search Rows      status = active            → returns N rows
        │
        ▼
[+2] Tools: Text aggregator          Source module = [+1]
        │                            Row separator: comma
        │                            Text: {{email}}
        ▼
[+3] Gmail: Send an Email
        To:  you@theweekenddugout.com        (or your from-address)
        BCC: {{ [+2] text }}                  (the comma-joined active list)
        Subject / Body: your existing digest  + footer (§8)
```

- **[+1] Search Rows**: Spreadsheet `Subscribers`, filter `status` **equal to**
  `active`.
- **[+2] Text aggregator**: collapses the matched rows into one comma-separated
  string of emails.
- **[+3] Gmail**: put the list in **BCC**, not To — one send, and subscribers
  never see each other. `To:` is your own address.
- Nothing else in the scenario changes; this replaces only the final Gmail step.

Do this in both send scenarios. They read the same sheet, so one subscriber list
feeds everything.

---

## 8. Email footer additions (compliance — add to the Gmail body)

Your current static footer has the disclaimer. A **paid** commercial email needs
two more lines. Append to the Gmail module footer in every send scenario:

```
Manage or cancel your subscription: [your Stripe customer-portal link]

RJR Trading Strategies LLC · 11907 Sun Valley Drive, Fort Washington, MD 20744

The Weekend Dugout is an informational service of RJR Trading Strategies LLC,
trading as The Weekend Dugout. Content summarizes publicly available filings and
news for educational purposes only and is not investment, legal, or tax advice or
a recommendation regarding any security. Accuracy and timeliness are not
guaranteed; original sources control. Consult a licensed professional before
making investment decisions.
```

- The **portal link** is your unsubscribe mechanism (cancel = off the list, via
  Scenario B). Required: recipients must be able to opt out.
- The **postal address** is a CAN-SPAM requirement for commercial email. You
  already list it in ToS §12; it must also appear in the email itself.

---

## 9. Deliverability & limits

- **Gmail cap:** two digests/day × up to 100 = ~200 recipient-emails/day.
  Workspace (2,000/day) is comfortable; consumer gmail.com (500/day) works at 100
  but has no headroom — moving to Workspace is the first upgrade if you're on a
  personal account.
- **BCC hygiene:** keep it one send with everyone BCC'd. Large BCC from consumer
  Gmail is more spam-prone than from Workspace or an ESP.
- **Send from a real address on your domain** (e.g. via Workspace on
  theweekenddugout.com) once DNS is set — improves deliverability vs a gmail.com
  from-address.

---

## 10. When to graduate off Gmail → ESP (Brevo / MailerLite free tier)

Move the list to an ESP when **any** of these hits — not before:

- [ ] You want a true one-click **unsubscribe link** separate from billing cancel.
- [ ] Recipients climb toward a few hundred (Gmail caps + spam filtering bite).
- [ ] Deliverability drops (opens fall, spam complaints appear).
- [ ] You want open/click analytics or scheduled campaigns.

Migration is small: Scenarios A/B change their **last module** from
"Sheets: Add/Update Row" to "ESP: Create/Remove Contact," and Scenario C sends
**through** the ESP to its list instead of Gmail BCC. The Stripe triggers and
filters are unchanged. Free tiers (Brevo 300/day, MailerLite 1k contacts) cover
you well past 100.

---

## 11. Go-live checklist

- [ ] Stripe Customer Portal enabled; portal link copied
- [ ] Restricted Stripe API key created; connection added in Make
- [ ] `Subscribers` sheet created with the §2 headers
- [ ] **Phase 0:** maintain the sheet by hand; Scenario C (§7) built and sending
- [ ] Email footer updated with portal link + postal address (§8)
- [ ] Test a real $1 (INVESTFEST26) checkout → confirm you receive the next digest
- [ ] **At ~20 subs:** build Scenario A (add) and Scenario B (remove)
- [ ] Test cancel in the portal → confirm the row flips to `canceled` at period end
```
