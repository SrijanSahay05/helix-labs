# Research run (demo-grade): white C2TE S1 tile adhesive, India

Run 2026-11-18 on branch `demo/tile-adhesive-research`. Purpose: real numbers behind the Helix demo's tile-adhesive Research preview.
Output is **decision support for a chemist**, not a proven recipe.

Evidence tags: **[E]** extracted from a document · **[P]** patent · **[L]** literature · **[M]** dated market listing · **[I]** inferred.

## 1. Brief (from `chori-lix/output/ct2e-tile-adhesive-20261023/00-brief.md`, user answers D5–D11)

- **Class:** ISO 13007-1 **C2TE S1**, IS 15477:2019 also applies. **White only.** India only. No cost ceiling. No supplier preference.
- **Reference:** Roff Vitrofix Adhesive (Pidilite), claims C2TE and IS 15477 Type 2 'T', **no S1**, so on deformability the brief is above the reference.

| ID | Target | Value | Method |
|---|---|---|---|
| T1 | Tensile adhesion, initial 28 d | ≥ 1.0 N/mm² | ISO 13007-2 |
| T2 | after water immersion | ≥ 1.0 N/mm² | ISO 13007-2 |
| T3 | after heat ageing | ≥ 1.0 N/mm² | ISO 13007-2 |
| T4 | after freeze–thaw | ≥ 1.0 N/mm² | ISO 13007-2 |
| T5 | Slip (T) | ≤ 0.5 mm | ISO 13007-2 |
| T6 | Extended open time (E), ≥ 30 min | ≥ 0.5 N/mm² | ISO 13007-2 |
| T14 | Transverse deformation (S1) | ≥ 2.5 mm, < 5 mm | EN 12002 / ISO 13007-2 |
| T9 | Pot life | ≈ 120 min (match reference) | to define |
| T15 | Whiteness, no staining of light stone | claim, needs target | to define |

14 failure modes (F1–F14) are in `chori-lix/output/ct2e-tile-adhesive-20261023/01-scope.md`.

## 2. Where the data came from

| Source | Version | What it gave | State |
|---|---|---|---|
| `chori-lix/output/ct2e-tile-adhesive-20261023` | chori-lix (pi orchestrator) | brief, targets, 14 failure modes, Roff Vitrofix TDS (OCR) | stopped at Step 1.3: research agents failed to launch (`Unknown subagent model haiku`) |
| `chori-lix/output/tile-adhesive-ct2e-20261023` | chori-lix | nothing beyond setup | stopped at Step 0 |
| `chori-lix/.tmp/output_archived/archived/myk-laticrete-111-20260916` | chori-lix v3 skill | **8 C2TE S1 competitors, 189 quote-verified values, 3 SDS compositions, 2 patents, 15 papers** | complete |
| `chori-lix/.tmp/output_archived/archived/tile-adhesive-full-20260925` | chori-lix v3 staged | intake + plan only | paused at 01c |
| `helix-v1/engine/.data/helix.db` | helix-v1 | HX-0004 intake failed (expired API key); HX-0005 intake mis-classified as tile cleaner, empty brief | no research |
| `chori-lix-helix-v2/docs/research_work/reference-runs` | helix-v2 | tile **cleaner** only | n/a |
| This run: 7 web searches | — | RDP/cellulose-ether dosage ranges, S1 grade guidance, India prices | demo-grade |

**No earlier version finished a tile-adhesive formulation run.** Competitor and literature evidence below is reused from the MYK Laticrete run; dosage windows and prices are new.

## 3. Competitor matrix (reused, [E], from MYK Laticrete run §3)

| Vendor · product | Class | Tensile initial | Water | Heat | Freeze–thaw | Transverse def. | Slip | Open time | Pot life |
|---|---|---|---|---|---|---|---|---|---|
| Roff · Extrofix Ultra T20/T21 | C2TES1 | ≥ 1.6 | ≥ 1.25 | ≥ 1.5 | ≥ 1.2 | ≥ 3.4 mm | ≤ 0.3 | ≥ 40 min | ≥ 120 min |
| Sika · SikaCeram-288 Flex S1 | C2TES1 | ≥ 1.5 | ≥ 1 | ≥ 1.2 | — | 3.02–3.05 mm | ≤ 0.35 | > 30 min | ≥ 180 min |
| Weber · weberset Flex | C2TES1 | 1.41 | 1.35 | 1.28 | N/A | 3.67 mm | no slip | 30 min | 4 h |
| CHRYSO · GripFix Prime S1 | C2TES1 | 1.7 ± 0.2 | 1.3 ± 0.2 | 1.5 ± 0.2 | — | ≥ 2.5 mm | < 0.5 | ~60 min | < 1 h |
| Ardex · Diamond Star (White) | C2TE (no S1) | > 1.50 | > 1.10 | > 1.20 | > 1.40 | — | 0.30 | 30 min | 3 h |
| MAPEI · Kerabond Plus + Isolastic (AU doc) | C2 S1 | 2.0 | 1.4 | 2.5 | 1.5 | — | — | ~20 min | > 8 h |

Units N/mm². Declared S1 values cluster at **3.0–3.7 mm**: the market has converged just above the 2.5 mm line.
The Roff product to beat for S1 is **Extrofix Ultra** (not Vitrofix, which has no S1).

## 4. What the bag contains

**SDS, [E]:** Ardex Diamond Star: Portland cement 40–50 %, silica 50–60 %, **polymer 5–10 %**. Mapei Kerabond Plus: cement 25–50 %, silica 50–75 %, CaCO₃ 2.5–5 %.
**Patent, [P]:** US6784229B2 Ex. 1 (white-cement adhesive): sand 60.4, **white cement 34.33**, fibre 0.48, water-retainer 1.42, CaCO₃ 3.40, calcium formate 0.34.
**Dosage windows found this run:**

| Role | Window | Tag | Source |
|---|---|---|---|
| RDP, C1 | 0–3 % | [L] | literature review table via search; Fritze presentation (1–3 %) |
| RDP, C2 | 3–6 % | [L] | same |
| RDP, high-quality C2TE S1 example | 3.0 % | [E] | [WACKER VINNAPAS workability](https://www.wacker.com/cms/en-fr/insights/vinnapas-workability.html) |
| Cellulose ether | 0.16–0.35 % | [P] | [US8366822](https://patents.google.com/patent/US8366822) |
| Cellulose ether (two-part chassis) | 0.75–1.42 % | [P] | US6784229B2 Ex. 3 / Ex. 1 |
| Calcium formate | 0.30–0.45 % | [P] | three patent examples (MYK run) |
| Starch ether | "small amount" | [M] | [Avebe](https://www.avebe.com/markets/industrial/building-and-construction/cementious-dry-mortar-additives/) (supplier claim) |

**Gap:** no source found measuring transverse deformation against RDP dose. A7 ("S1 needs more RDP than plain C2TE") is still **[I]**. Flexible VAc/E grades are sold specifically for C2TES1 ([Celotech](https://www.celotech.com/?p=11581)).
**Trade-off [L]:** better slip resistance from cellulose ether often comes with faster skinning (shorter open time). See the [Qualicer paper](https://www.qualicer.org/recopilatorio/ponencias/pdfs/0033082e.pdf). This is the main tension in F5 and F6 under Indian heat.

## 5. Candidate routes

All are single-component white powders, wt % on dry mix. **Route compositions are [I]**: built from the windows in §4, not tested.

| Material | R1 Balanced S1 | R2 High-polymer S1 | R3 Lean C2TE |
|---|---|---|---|
| White Portland cement (IS 8042) | 35.0 | 33.0 | 38.0 |
| Graded silica sand 0.1–0.5 mm | 51.55 | 51.0 | 50.65 |
| Fine white CaCO₃ | 8.0 | 8.0 | 7.5 |
| RDP, flexible VAE (S1 grade) | **4.5** | **6.5** | **3.0** |
| MHEC (tile-adhesive grade) | 0.35 | 0.40 | 0.30 |
| Starch ether | 0.05 | 0.05 | 0.05 |
| Calcium formate | 0.40 | 0.40 | 0.40 |
| White cellulose fibre | 0.10 | 0.60 | 0.05 |
| Defoamer powder | 0.05 | 0.05 | 0.05 |
| **Total** | 100 | 100 | 100 |
| **RM cost ₹/kg** | **20.6** | **24.5** | **18.4** |
| ₹ per 20 kg bag (RM only) | 412 | 491 | 367 |
| RDP share of RM cost | 38 % | 46 % | 28 % |
| Expected position | S1 likely, middle of the 3.0–3.7 mm cluster | S1 with margin; best heat ageing and water resistance; highest cost | meets C2TE; **S1 at risk** (3 % is the WACKER C2TE example) |

**Recommendation for the lab:** R1 first, with R2 and R3 alongside it as the high and low RDP points. Run all three on T14 to get the RDP-to-deformation curve no source gave us.

### Prices used (₹/kg, FX ₹85/USD [I])

| Material | ₹/kg | Tag | Source |
|---|---|---|---|
| White cement | 23 | [M] | [InfraLens Delhi](https://infralens.in/prices/cement/delhi), dealer–retail; IndiaMART listings conflict (₹19–40) |
| RDP VAE | 173 (US$2.04) | [M] | [Expert Market Research, India Q1 2026](https://www.expertmarketresearch.com/price-forecast/vae-redispersible-powder-price-trends) |
| MHEC / HPMC | 380 | [M] | TradeIndia HPMC listing (asking price) |
| Silica sand, CaCO₃, Ca formate, starch ether, fibre, defoamer | 4 / 6 / 70 / 300 / 150 / 600 | [I] | not searched; replace with quotes |

Market check: a polymer-modified adhesive retails at about ₹700–1,200 per 20 kg bag ([advertorial, low reliability](https://www.nationalheraldindia.com/advertorial/tile-adhesive-price-in-india-2026-per-bag-per-sq-ft-and-per-brand)).

## 6. Literature used (from MYK run §7, [L])

1. Ceramic Tile Adhesives from the Producer's Perspective (2021) `10.3390/ceramics4030027`
2. Standards and Assessment of Construction Products: Ceramic Tile Adhesives (2022) `10.3390/standards2020013`
3. Main strength parameters of deformable cement adhesives (2024) `10.22630/aspa.2024.23.18`
4. Young's Modulus of Deformable Cement Adhesives Under Thermal Action (2025) `10.3390/ma18235341`
5. Core-Shell Morphology of Redispersible Powders in Polymer-Cement Mortars (2018) `10.3390/polym10101122`
6. Skin formation in adhesive mortars, MRI and interfacial rheology (2019) `10.1016/j.cemconcomp.2019.02.002`
7. Effect of RDP on thin-bed cementitious mortars (2020) `10.32047/cwb.2020.25.3.1`
8. Bond strength of polymer-modified mortars during wetting and drying (2015) `10.1590/1516-1439.028915`
9. Shelf-life of cement admixed with RDP (2016) `10.1016/j.conbuildmat.2016.04.056`

## 7. Open questions

- RDP dose vs transverse deformation: no source found. Settle it with the R1/R2/R3 ladder.
- Whiteness (T15) has no number yet. Pick a colour or whiteness index against a reference white SKU.
- Cr(VI) reducer for white cement, and whether an Indian rule requires one: not researched.
- Open time at 35–45 °C: no study found. Needs an adapted ISO 13007-2 open-time test at elevated temperature.
- Prices tagged [I] need supplier quotes.

## 8. Search log (this run)

| # | Query | Useful result |
|---|---|---|
| 1 | C2TE S1 starting formulation RDP % cellulose ether white cement | CE 0.16–0.35 % (US8366822); Celotech S1 grade list |
| 2 | RDP dosage transverse deformation EN 12002 S1 | RDP C1 0–3 %, C2 3–6 %; no dose–deformation data |
| 3 | white cement price India 2026 | ₹22–24/kg dealer (InfraLens) |
| 4 | VAE RDP price India 2026 | US$2.04/kg Q1 2026 |
| 5 | VINNAPAS C2TE S1 guide formulation | 3.0 % RDP high-quality example; S1 ≥ 2.5 mm, S2 ≥ 5 mm |
| 6 | open time 35 °C cellulose ether starch ether slip | slip vs skinning trade-off (Qualicer) |
| 7 | HPMC MHEC price India 2026 | ₹380/kg listing |
