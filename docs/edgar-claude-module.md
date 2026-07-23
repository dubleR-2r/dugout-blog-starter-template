# Edgar Tracker — Anthropic Claude Module (paste-ready)

Placement, config, and templates for adding the analysis step to the live Make scenario.

---

## 1. Placement

Insert the Anthropic Claude module **between Iterator 5 and Tools 6 (Text aggregator)**.

```
Make Code 10 → Iterator 9 → HTTP 1 → Make Code 11 → Iterator 5 → ★Claude★ → Tools 6 → Gmail 7
 (schedule)     (per CIK)   (EDGAR)  (parse+dedup)   (per new     (analyze  (collect  (+ static
                                     new filings)     filing)      one)      blocks)   disclaimer)
```

Why here: Make Code 11 already dedups and emits only new filings, so Claude runs once per *new* filing on clean data — satisfies "filter before the expensive step." The Text aggregator's job is unchanged (collapse many → one); it now collapses Claude's structured blocks instead of raw filing text.

---

## 2. Module settings

- **Module:** Anthropic Claude → *Create a Message*
- **Model:** `claude-sonnet` (this is thesis synthesis, not tagging — Haiku goes shallow here). Watch first-week credit burn before locking it in.
- **Max tokens:** ~700
- **Temperature:** `0.2` (repeatable classification, not creativity)

---

## 3. System prompt (paste into the module's System field)

```
ROLE
You summarize and classify one SEC filing at a time against a fixed investment
thesis. You are a research analyst, not an adviser. You describe what a filing
discloses and where it lands in the thesis. You never advise action.

PROHIBITED (hard rules)
- No action/directive language: never write buy, sell, trim, add, enter, exit,
  take profits, accumulate, "should," "I recommend," "target price," or any
  imperative to trade.
- No prediction or price forecasting ("likely to rise," "will break out").
- No conviction scores, position sizing, or portfolio changes.
- No facts not present in the filing. If a figure isn't in the source, say
  "not disclosed."

REQUIRED
- Neutral, observational language (what the filing IS / DISCLOSES).
- Tag each claim as [confirmed] (in the filing), [inferred], or [estimate].
- Output ONLY the analysis line defined in OUTPUT. Do NOT print ticker, form
  type, filing date, or link — those are added by the email template.

THESIS LAYERS (assign exactly one)
Foundry/Packaging (TSM, AMKR) | Memory/HBM (MU) | Compute (NVDA, AVGO, AMD, ALAB)
| Interconnect/Networking (MRVL, ANET) | EDA (CDNS, SNPS) | Equipment (ASML, AMAT)
| Power/Energy (CEG, VST, AIPO) | Other/None

CORE vs SATELLITE
Core toll-keepers: TSM, MU, NVDA, AVGO, SNPS, CDNS, ASML, SMH.
Satellites: AMD, MRVL, CEG, HOOD, NOW, AMKR, ALAB, VST. Everything else = Watch/NA.

THEMES (tag every theme the filing bears on by its LABEL, comma-separated; use
"—" if none. Always output the label text, never a code.)
"HBM pricing" — memory/HBM pricing power real or contract-capped? (HBM
   contracts, memory pricing, share)
"Capex concentration" — whole stack riding one hyperscaler capex cycle? (capex
   guides, backlog, correlation)
"Supply vs demand" — capacity-constrained toll keepers (TSM, SK Hynix):
   revenue = supply output, not demand (utilization/capex language)
"Moat durability" — monopoly vs contested (new entrants, ADR listings adding
   capacity, onshoring)
"Power constraint" — power as the next binding constraint (data-center power
   demand, CEG/VST/AIPO)

MATERIALITY
High = directly moves a theme or a core name's moat/economics.
Medium = thesis-adjacent, worth noting.
Low = routine/administrative (most Form 4s, 8-K item 5.02 housekeeping, etc.).

OUTPUT (return exactly this, nothing else — no preamble, no code fences, no
ticker/form/date/link)
<em>{Layer} · {Core | Satellite | Watch} · {High | Medium | Low} · {theme labels comma-separated, or —}</em><br>{two neutral sentences. Tag figures [confirmed]/[inferred]/[estimate]. No action or predictive language.}
```

---

## 4. User message template (paste into the Messages → user content field)

Map each field from the **Iterator 5** output bundle. Rename to match your actual keys.

```
Analyze this single SEC filing.

Ticker/issuer: {{5.ticker}}
Form type: {{5.formType}}
Filed: {{5.filedDate}}
Title: {{5.title}}
EDGAR link: {{5.link}}
Excerpt/summary: {{5.excerpt}}

Return exactly one block in the OUTPUT format. No preamble, no closing text.
```

---

## 5. Output format (how the section-3 OUTPUT block renders)

The OUTPUT block is already inside the section-3 system prompt — no separate
paste needed. It works because the Tools 6 template builds the metadata scaffold
(form, company, ticker, filed date, link) from the `5.*` filing fields, so Claude
returns **only the analysis line**, HTML-safe, to slot into that scaffold.

Renders per filing as:
> **8-K** — Micron Technology (MU)
> *Memory/HBM · Core · High · HBM pricing, Supply vs demand*
> Micron disclosed [confirmed] a multi-year HBM supply agreement; pricing terms not disclosed.
> Filed: 2026-07-21 · View filing

---

## 6. Tools 6 — Text aggregator settings

- **Source Module: Iterator [9]** — correct. With the nested loops
  (Iterator 9 = per CIK, Iterator 5 = per filing), pointing the aggregator at
  the OUTER iterator collapses every filing across every ticker into ONE email.
  Setting it to Iterator 5 would emit one email per CIK.
- **Text template:** keep the metadata tokens from `5.*`, but map the analysis
  line to the **Anthropic module's Result** token, not `5.meaning`:

```html
<p><strong>{{5.form}}</strong> — {{5.company}} ({{5.ticker}})<br>
{{ANTHROPIC.result}}<br>
Filed: {{5.filingDate}}<br>
<a href="{{5.url}}">View filing</a></p>
```

  `{{ANTHROPIC.result}}` = the Claude module's message-content output (labelled
  **Result** in the mapping panel; the exact number depends on where the module
  lands in the flow). Both `5.*` and the Claude output resolve per-iteration, so
  each aggregated row pairs the right filing with its own analysis.

---

## 7. Gmail 7 — body + disclaimer

Email body = the Text aggregator output **followed by a hard-coded footer**.
Do not let Claude generate the disclaimer — a static field can't be dropped or
reworded by the model.

```
{{6.text}}

—
Automated summary of SEC filings for personal research. Filing interpretations
are AI-generated and may contain errors — verify against the primary source
before acting. This is not investment advice and reflects no recommendation to
buy, sell, or hold any security.
```

(Publishing-grade footer, for any audience-facing version, in the project notes.)

---

## 7b. Teaching-audience legend — STAGED, NOT ACTIVE

Do NOT add this to the personal tracker — self-describing tags don't need it.
Drop it into the email footer only when this feed goes audience-facing (Weekend
Dugout), so a new reader can decode the theme tags. Pair it with the
publishing-grade disclaimer, not the personal one.

```html
<hr>
<p style="font-size:12px;color:#666">
<strong>How to read the tags</strong><br>
Each filing is labelled <em>Layer · Holding type · Materiality · Themes</em>.<br><br>
<strong>Materiality</strong> — how much it matters:
<em>High</em> moves the thesis, <em>Medium</em> is worth knowing,
<em>Low</em> is routine.<br>
<strong>Holding type</strong> — <em>Core</em> = long-term chokepoint position;
<em>Satellite</em> = smaller tactical position; <em>Watch</em> = not held.<br><br>
<strong>Themes</strong> — the open questions each filing informs:<br>
• <strong>HBM pricing</strong> — is memory pricing power real, or capped by long-term contracts?<br>
• <strong>Capex concentration</strong> — is the whole AI-infrastructure stack riding one hyperscaler's spending?<br>
• <strong>Supply vs demand</strong> — for capacity-constrained suppliers, revenue reflects output, not true demand.<br>
• <strong>Moat durability</strong> — is the company a durable monopoly or a contested market?<br>
• <strong>Power constraint</strong> — is data-center power the next binding bottleneck?
</p>
```

Keep this list in sync with the THEMES block in the system prompt (section 3).
If a theme label changes there, change it here too.

---

## 8. Batch alternative (if new-filing counts spike or you want cross-filing ranking)

Trade-off: per-filing (above) = N Claude calls + N Make ops per run, simplest
insertion, isolated analysis. Batch = 1 call + 1 op per run, cheaper at volume,
and the model can rank/cluster across all filings — but loses the clean in-loop
drop-in.

To switch to batch:
1. Move the Claude module to **after Tools 6, before Gmail 7**.
2. Change Tools 6 to aggregate a **JSON array of raw filings** (ticker, form,
   date, title, link, excerpt) instead of formatted text.
3. Claude system prompt: same rules, but "you receive an array; return the full
   email body, filings grouped by layer, High materiality first."
4. Gmail body = Claude `{{output}}` + the same static disclaimer footer.

---

## 9. Guardrails checklist

- [ ] Claude sits after Make Code 11 (only new filings reach it)
- [ ] Temperature 0.2, max tokens ~700
- [ ] Prompt forbids all action/predictive language
- [ ] Disclaimer is static in Gmail, not model-generated
- [ ] Text aggregator Source Module = Iterator [9] (single combined email)
- [ ] Analysis line in the template maps to Anthropic **Result**, not `5.meaning`
- [ ] First-run: verify the analysis line shows Claude output, not the raw field
```
