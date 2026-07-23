# News Brief — Anthropic Claude Module (paste-ready)

Analysis step and compliance footer for the news-brief scenario. Sibling to
`edgar-claude-module.md`; the two briefs share one tag vocabulary and one
subscriber list (`stripe-make-subscriber-flow.md`).

**Why this isn't a copy of the EDGAR doc:** a filing is a primary source — it is
authoritative and never changes once filed, so "verify against the primary
source" is a complete instruction. News is a *secondary account* that can be
wrong on arrival, gets updated or retracted, and goes stale within hours. Every
difference below follows from that.

---

## 1. Placement

Same shape as EDGAR: the Claude module goes **after dedup, inside the per-item
loop, before the text aggregator** — so it runs once per *new* story on clean
data.

```
Schedule → Fetch feeds → Parse + dedup → Iterator (per new story) → ★Claude★ → Aggregator → Gmail
                                          (filter BEFORE the expensive step)
```

> Module numbers are left unmapped on purpose — I haven't seen your news
> scenario. Substitute your actual iterator/aggregator numbers where EDGAR uses
> `5.*` and `6.text`.

Dedup matters more here than for filings. One event produces a dozen near-identical
headlines across outlets; without clustering you pay for a dozen Claude calls and
mail a dozen rows about one story. If your parse step can't cluster, use the batch
mode in §8 — a single call can dedup across the whole set, which per-item calls
structurally cannot.

---

## 2. Module settings

- **Module:** Anthropic Claude → *Create a Message*
- **Model:** `claude-sonnet` — same reasoning as EDGAR; this is thesis synthesis
- **Max tokens:** ~500 (shorter than EDGAR: news items get two sentences, and a
  low cap is also a copyright guardrail — see §3)
- **Temperature:** `0.2`

---

## 3. System prompt (paste into the module's System field)

```
ROLE
You summarize and classify one news story at a time against a fixed investment
thesis. You are a research analyst, not an adviser. You describe what was
REPORTED and where it lands in the thesis. You never advise action.

SOURCE HANDLING (this is news, not a filing — it is not authoritative)
- Attribute, never assert. Write "Reuters reports..." not "Nvidia will...".
- If only one outlet carries a claim, say "single-source". If the story cites
  unnamed sources, say "unconfirmed".
- Distinguish an announcement from a completed event ("said it plans to" vs
  "has").
- Never reproduce more than ~25 words of the source text. Summarize in your own
  words. Do not reproduce paywalled article bodies.

PROHIBITED (hard rules)
- No action/directive language: never write buy, sell, trim, add, enter, exit,
  take profits, accumulate, "should," "I recommend," "target price," or any
  imperative to trade.
- No prediction or price forecasting ("likely to rise," "will break out").
  News copy is written in exactly this register — strip it, do not echo it.
- No conviction scores, position sizing, or portfolio changes.
- No facts not present in the source. If a figure isn't there, say
  "not disclosed."
- Do not treat market-reaction reporting ("shares jumped 6%") as thesis
  evidence. Report it as price action, or omit it.

REQUIRED
- Neutral, observational language (what was REPORTED).
- Tag each claim as [reported] (stated in the source), [inferred], or
  [estimate]. Note: EDGAR uses [confirmed] for filing facts; news gets
  [reported] instead, because nothing here is confirmed by a primary source.
- Output ONLY the analysis line defined in OUTPUT. Do NOT print outlet,
  headline, timestamp, or link — those are added by the email template.

THESIS LAYERS (assign exactly one)
Foundry/Packaging (TSM, AMKR) | Memory/HBM (MU) | Compute (NVDA, AVGO, AMD, ALAB)
| Interconnect/Networking (MRVL, ANET) | EDA (CDNS, SNPS) | Equipment (ASML, AMAT)
| Power/Energy (CEG, VST, AIPO) | Other/None

CORE vs SATELLITE
Core toll-keepers: TSM, MU, NVDA, AVGO, SNPS, CDNS, ASML, SMH.
Satellites: AMD, MRVL, CEG, HOOD, NOW, AMKR, ALAB, VST. Everything else = Watch/NA.

THEMES (tag every theme the story bears on by its LABEL, comma-separated; use
"—" if none. Always output the label text, never a code.)
"HBM pricing" — memory/HBM pricing power real or contract-capped?
"Capex concentration" — whole stack riding one hyperscaler capex cycle?
"Supply vs demand" — capacity-constrained toll keepers: revenue = supply output,
   not demand
"Moat durability" — monopoly vs contested (new entrants, added capacity, onshoring)
"Power constraint" — power as the next binding constraint

MATERIALITY
High = directly moves a theme or a core name's moat/economics.
Medium = thesis-adjacent, worth noting.
Low = routine (analyst ratings, price-target changes, recycled coverage).

OUTPUT (return exactly this, nothing else — no preamble, no code fences, no
outlet/headline/timestamp/link)
<em>{Layer} · {Core | Satellite | Watch} · {High | Medium | Low} · {theme labels comma-separated, or —}</em><br>{two neutral sentences, attributed. Tag claims [reported]/[inferred]/[estimate]. Flag single-source or unconfirmed. No action or predictive language.}
```

Keep the THESIS LAYERS / CORE vs SATELLITE / THEMES blocks **byte-identical** to
`edgar-claude-module.md` §3. Both briefs feed one reader and one tag legend; if
the vocabularies drift, the legend in §7b lies about one of them.

---

## 4. User message template

```
Analyze this single news story.

Outlet: {{outlet}}
Headline: {{title}}
Published: {{pubDate}}
Link: {{link}}
Excerpt: {{excerpt}}

Return exactly one block in the OUTPUT format. No preamble, no closing text.
```

---

## 5. Output format (how the §3 OUTPUT block renders)

```html
<p><strong>{{outlet}}</strong> — {{title}}<br>
{{ANTHROPIC.result}}<br>
Published: {{pubDate}}<br>
<a href="{{link}}">Read the original</a></p>
```

Renders per story as:

> **Reuters** — Micron said to be in talks over HBM supply
> *Memory/HBM · Core · Medium · HBM pricing, Supply vs demand*
> Reuters reports [reported] Micron is in talks over a multi-year HBM supply
> arrangement; terms were not disclosed and the account is single-source.
> Published: 2026-07-22 · Read the original

The link is not optional decoration — it is what makes the summary fair use
rather than a substitute for the source, and it is the mechanism the disclaimer
in §7 points readers to.

---

## 6. Aggregator settings

Identical logic to EDGAR §6: point the aggregator at the **outer** loop so every
story collapses into ONE email, and map the analysis line to the Anthropic
module's **Result** token, not the raw feed field.

Add a **cap**: sort by materiality and take the top ~12. A news feed has no
natural volume ceiling the way a filing list does; without a cap, one busy news
day mails a wall of Low-materiality analyst-rating items and trains people to
stop opening it.

---

## 7. Gmail — body + disclaimer

Email body = aggregator output **followed by a hard-coded footer**. Do not let
Claude generate the disclaimer — a static field can't be dropped or reworded by
the model.

### Personal-research version

```
{{aggregator.text}}

—
Automated brief compiled from third-party news reporting, as of
{{formatDate(now; "YYYY-MM-DD HH:mm")}} ET.
Summaries are AI-generated from headlines and excerpts and may contain errors,
omissions, or stale information; the underlying reporting may itself be updated
or retracted. Read the linked original before relying on anything here. This is
not investment advice and reflects no recommendation to buy, sell, or hold any
security.
```

### Publishing-grade version (audience-facing)

```html
<hr>
<p style="font-size:12px;color:#666">
Compiled automatically from publicly available news reporting as of
{{formatDate(now; "MMMM D, YYYY h:mm A")}} ET. Each item links to the original
source; headlines and excerpts remain the property of their publishers, who are
not affiliated with, and do not endorse, this publication. Summaries and any
characterization of significance are AI-generated and may contain errors or
omissions, and the underlying reporting may be updated or corrected after
publication. Nothing here is investment advice, an offer, or a solicitation, and
it reflects no recommendation to buy, sell, or hold any security. RJR Trading
Strategies LLC and its principals may hold positions in securities mentioned.
</p>
```

Notes:

- **Timestamp:** `formatDate(now; ...)` renders send time, which is what you
  want — it tells the reader how stale the brief is. Set the scenario timezone
  (Make → scenario settings) or `now` resolves in UTC and the "ET" is a lie.
- **The positions-disclosure line is the one to keep.** You run a thesis book in
  the same names this publication covers. Saying so is cheap; omitting it is the
  part that looks bad in hindsight.
- **This is the analysis disclaimer, not the whole footer.** The commercial
  requirements — customer-portal/unsubscribe link and the CAN-SPAM postal
  address — are in `stripe-make-subscriber-flow.md` §8 and go *below* this block
  in the same Gmail body. Don't duplicate the entity boilerplate in both; §8's
  paragraph already covers "filings and news."
- **Get the publishing-grade version reviewed by a lawyer** before it ships to
  paying subscribers. It's written conservatively, but that is not the same as a
  professional opinion that it's sufficient for a paid product under your entity.

Website equivalents live in `src/consts.ts` as `AI_DISCLOSURE_NEWS` and
`AI_DISCLOSURE_FILINGS`. If you reword one, reword its twin.

---

## 7b. Teaching-audience legend

The news brief uses the same tag grammar as the filings brief, so it needs the
same legend — reuse the block in `edgar-claude-module.md` §7b verbatim, changing
only the opening line from "Each filing is labelled" to "Each item is labelled".

If both briefs go out on the same day, the legend only needs to appear once per
email, not once per section.

---

## 8. Batch alternative (recommended here, unlike EDGAR)

For news this is the better default, not just a volume fallback. One call over
the whole set lets the model **cluster duplicate coverage of one event** and rank
across stories — per-item calls cannot do either, and duplicate coverage is the
main failure mode of a news feed.

1. Move the Claude module to **after the aggregator, before Gmail**.
2. Aggregate a **JSON array** of stories (outlet, headline, date, link, excerpt).
3. System prompt: same rules, plus "you receive an array; merge stories covering
   the same event into one entry citing multiple outlets; return the full email
   body, grouped by layer, High materiality first; include at most 12 entries."
4. Gmail body = Claude output + the same static footer.

---

## 9. Guardrails checklist

- [ ] Claude runs only on deduped/new stories
- [ ] Temperature 0.2, max tokens ~500
- [ ] Prompt forbids all action/predictive language
- [ ] Prompt requires attribution and flags single-source/unconfirmed claims
- [ ] Excerpt reproduction capped (~25 words); every item links to the original
- [ ] Item cap (~12) so a heavy news day can't produce a wall of Low items
- [ ] Disclaimer static in Gmail, not model-generated
- [ ] Scenario timezone set, so the "as of" timestamp isn't UTC labelled ET
- [ ] Commercial footer (portal link + postal address) appended per
      `stripe-make-subscriber-flow.md` §8
- [ ] Tag vocabulary matches `edgar-claude-module.md` §3 exactly
```
