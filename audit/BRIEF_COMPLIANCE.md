# Helix brief compliance — 2026-10-09

Summary: PASS 153 · PARTIAL 0 · MISSING 0 · DEVIATION 0 · N/A-OPEN 7  (coverage = 100.0 %)

Audit suite: `e2e/brief-audit.spec.ts` (Playwright, Chrome) at 1280×800 for every requirement; layout and dark-theme smoke at 1440 px: 4/4 layout + dark checks pass; 1920 px: 4/4 layout + dark checks pass. Scientist and Non-scientist flows are both driven. Unit tests: `src/data/brief.test.ts` (passing). Regenerate with `npm run audit`.

## Decisions needed (only true blockers)

None blocking. Open questions (§J) are configurable with these defaults applied: categories in `src/data/categories.ts` + Templates page; non-scientist output = *product spec + R&D brief*; standards = IS + EN (ASTM available); no hard-coded organisation (BRAND in `src/data/copy.ts`); past formulations toggle off; accent `#6D4AFF` in `src/styles/index.css`.

## Results table

| ID | Requirement (brief wording) | Status | Evidence (code) | Evidence (screen) | Fix plan / Notes |
|---|---|---|---|---|---|
| FL-01 | Desktop web app that turns a product need into a lab-validated formulation for any specialty construction chemical. Home and copy reflect this. | **PASS** | `src/features/projects/ProjectsPage.tsx:68` | [FL-01.png](screens/FL-01.png) | — |
| FL-02 | Flow order: Who is using? → Category → Subcategory → Exact use case → (guided questions / benchmark & targets) → Brief review → Literature → Pathways → Trials → Lab results → Targets met? → Final / next iteration back to Trials. | **PASS** | `src/features/project/FlowRail.tsx:14`<br>`src/store/project.ts:9` | [FL-02.png](screens/FL-02.png) | — |
| FL-03 | "Four inputs, two modes, one lab loop": the first question sets the mode; both modes produce the same brief; failed targets loop back to new trials. | **PASS** | `src/features/intake/steps/StepUseCase.tsx:225`<br>`src/features/intake/IntakeWizard.tsx:220` | [FL-03.png](screens/FL-03.png) | — |
| FL-04 | The loop is real: unmet targets → next iteration returns to Trials with new trials; iteration count visible. | **PASS** | `src/agent/controller.ts:85`<br>`src/features/project/FlowRail.tsx:104` | [FL-04.png](screens/FL-04.png) | — |
| IN-01 | Four inputs in this order, as a stepper. | **PASS** | `src/features/intake/IntakeWizard.tsx:299` | [IN-01.png](screens/IN-01.png) | — |
| IN-02 | A brief panel on the right fills in as the user goes. | **PASS** | `src/features/intake/BriefPanel.tsx:55` | [IN-02.png](screens/IN-02.png) | — |
| IN-03 | Step 0 "Who is using Helix?": Scientist / Non-scientist as two large cards. | **PASS** | `src/features/intake/steps/StepWho.tsx:10` | [IN-03.png](screens/IN-03.png) | — |
| IN-04 | The Step 0 choice is remembered per user (persists across reloads and new projects). | **PASS** | `src/store/ui.ts:10` | [IN-04.png](screens/IN-04.png) | — |
| IN-05 | The mode is switchable at any time (global mode switch). | **PASS** | `src/components/shell/ModeSwitch.tsx:19` | [IN-05.png](screens/IN-05.png) | — |
| IN-06 | Step 1 Category: one category, card grid with search. | **PASS** | `src/features/intake/steps/StepCategory.tsx:70` | [IN-06.png](screens/IN-06.png) | — |
| IN-07 | Six broad groups in order of construction; pick a group, then a category. | **PASS** | `src/data/categories.ts:9` | [IN-07.png](screens/IN-07.png) | — |
| IN-08 | Step 2 Subcategory: one sub-SKU, list filtered by category. | **PASS** | `src/features/intake/steps/StepSubcategory.tsx:12` | [IN-08.png](screens/IN-08.png) | — |
| IN-09 | Choosing a subcategory sets the default standard and the property template (visible). | **PASS** | `src/features/intake/steps/StepSubcategory.tsx:62`<br>`src/features/intake/steps/StepSubcategory.tsx:117` | [IN-09.png](screens/IN-09.png) | — |
| IN-10 | Chemistry and physical form are filters on the subcategory screen. | **PASS** | `src/features/intake/steps/StepSubcategory.tsx:46` | [IN-10.png](screens/IN-10.png) | — |
| IN-11 | Step 3 Exact use case. Scientist: structured fields. Non-scientist: guided questions. | **PASS** | `src/features/intake/steps/StepUseCase.tsx:252` | [IN-11.png](screens/IN-11.png) | — |
| IN-12a | Use-case field: substrate. | **PASS** | `src/data/copy.ts:48` | [IN-12a.png](screens/IN-12a.png) | — |
| IN-12b | Use-case field: surface (wall, floor, facade, wet area, submerged). | **PASS** | `src/data/useCaseOptions.ts:2` | [IN-12b.png](screens/IN-12b.png) | — |
| IN-12c | Use-case field: tile or material type and size. | **PASS** | `src/data/copy.ts:50` | [IN-12c.png](screens/IN-12c.png) | — |
| IN-12d | Use-case field: interior or exterior. | **PASS** | `src/data/copy.ts:52` | [IN-12d.png](screens/IN-12d.png) | — |
| IN-12e | Use-case field: climate and application temperature. | **PASS** | `src/data/copy.ts:54` | [IN-12e.png](screens/IN-12e.png) | — |
| IN-12f | Use-case field: load and traffic. | **PASS** | `src/data/copy.ts:55` | [IN-12f.png](screens/IN-12f.png) | — |
| IN-12g | Use-case field: application method. | **PASS** | `src/data/copy.ts:56` | [IN-12g.png](screens/IN-12g.png) | — |
| IN-12h | Use-case field: speed needed (time to grout, time to traffic). | **PASS** | `src/data/copy.ts:57` | [IN-12h.png](screens/IN-12h.png) | — |
| CAT-01 | Group 1 · Admixtures (Plasticisers, superplasticisers, retarders, accelerators, air entrainers, waterproofing admixtures, corrosion inhibitors) | **PASS** | `src/data/categories.ts:52`<br>`src/data/brief.test.ts:11` | [CAT-01.png](screens/CAT-01.png) | — |
| CAT-02 | Group 1 · Shotcrete accelerators | **PASS** | `src/data/categories.ts:61`<br>`src/data/brief.test.ts:11` | [CAT-02.png](screens/CAT-02.png) | — |
| CAT-03 | Group 1 · Fibres | **PASS** | `src/data/categories.ts:65`<br>`src/data/brief.test.ts:11` | [CAT-03.png](screens/CAT-03.png) | — |
| CAT-04 | Group 1 · Cement grinding aids | **PASS** | `src/data/categories.ts:69`<br>`src/data/brief.test.ts:11` | [CAT-04.png](screens/CAT-04.png) | — |
| CAT-05 | Group 1 · Curing compounds | **PASS** | `src/data/categories.ts:73`<br>`src/data/brief.test.ts:11` | [CAT-05.png](screens/CAT-05.png) | — |
| CAT-06 | Group 1 · Release agents | **PASS** | `src/data/categories.ts:77`<br>`src/data/brief.test.ts:11` | [CAT-06.png](screens/CAT-06.png) | — |
| CAT-07 | Group 2 · Block-jointing mortar | **PASS** | `src/data/categories.ts:82`<br>`src/data/brief.test.ts:12` | [CAT-07.png](screens/CAT-07.png) | — |
| CAT-08 | Group 2 · Plaster (Ready-mix plaster, gypsum plaster) | **PASS** | `src/data/categories.ts:85`<br>`src/data/brief.test.ts:12` | [CAT-08.png](screens/CAT-08.png) | — |
| CAT-09 | Group 2 · Wall putty and skim coat | **PASS** | `src/data/categories.ts:89`<br>`src/data/brief.test.ts:12` | [CAT-09.png](screens/CAT-09.png) | — |
| CAT-10 | Group 2 · Bonding agents and primers | **PASS** | `src/data/categories.ts:93`<br>`src/data/brief.test.ts:12` | [CAT-10.png](screens/CAT-10.png) | — |
| CAT-11 | Group 2 · Thermal insulation mortars | **PASS** | `src/data/categories.ts:97`<br>`src/data/brief.test.ts:12` | [CAT-11.png](screens/CAT-11.png) | — |
| CAT-12 | Group 3 · Waterproofing coatings (Cementitious, acrylic, polyurethane, bituminous, crystalline) | **PASS** | `src/data/categories.ts:101`<br>`src/data/brief.test.ts:13` | [CAT-12.png](screens/CAT-12.png) | — |
| CAT-13 | Group 3 · Membranes | **PASS** | `src/data/categories.ts:108`<br>`src/data/brief.test.ts:13` | [CAT-13.png](screens/CAT-13.png) | — |
| CAT-14 | Group 3 · Joint sealants | **PASS** | `src/data/categories.ts:112`<br>`src/data/brief.test.ts:13` | [CAT-14.png](screens/CAT-14.png) | — |
| CAT-15 | Group 3 · Injection systems for leaks | **PASS** | `src/data/categories.ts:116`<br>`src/data/brief.test.ts:13` | [CAT-15.png](screens/CAT-15.png) | — |
| CAT-16 | Group 4 · Tile and stone adhesives | **PASS** | `src/data/categories.ts:121`<br>`src/data/brief.test.ts:14` | [CAT-16.png](screens/CAT-16.png) | — |
| CAT-17 | Group 4 · Tile grouts | **PASS** | `src/data/categories.ts:128`<br>`src/data/brief.test.ts:14` | [CAT-17.png](screens/CAT-17.png) | — |
| CAT-18 | Group 4 · Epoxy grouts | **PASS** | `src/data/categories.ts:132`<br>`src/data/brief.test.ts:14` | [CAT-18.png](screens/CAT-18.png) | — |
| CAT-19 | Group 4 · Stone care and sealers | **PASS** | `src/data/categories.ts:135`<br>`src/data/brief.test.ts:14` | [CAT-19.png](screens/CAT-19.png) | — |
| CAT-20 | Group 4 · Self-levelling compounds | **PASS** | `src/data/categories.ts:138`<br>`src/data/brief.test.ts:14` | [CAT-20.png](screens/CAT-20.png) | — |
| CAT-21 | Group 4 · Screeds | **PASS** | `src/data/categories.ts:141`<br>`src/data/brief.test.ts:14` | [CAT-21.png](screens/CAT-21.png) | — |
| CAT-22 | Group 4 · Floor hardeners | **PASS** | `src/data/categories.ts:144`<br>`src/data/brief.test.ts:14` | [CAT-22.png](screens/CAT-22.png) | — |
| CAT-23 | Group 4 · Resin floors (Epoxy, polyurethane) | **PASS** | `src/data/categories.ts:147`<br>`src/data/brief.test.ts:14` | [CAT-23.png](screens/CAT-23.png) | — |
| CAT-24 | Group 5 · Repair mortars | **PASS** | `src/data/categories.ts:152`<br>`src/data/brief.test.ts:15` | [CAT-24.png](screens/CAT-24.png) | — |
| CAT-25 | Group 5 · Micro-concrete | **PASS** | `src/data/categories.ts:156`<br>`src/data/brief.test.ts:15` | [CAT-25.png](screens/CAT-25.png) | — |
| CAT-26 | Group 5 · Structural injection resins | **PASS** | `src/data/categories.ts:159`<br>`src/data/brief.test.ts:15` | [CAT-26.png](screens/CAT-26.png) | — |
| CAT-27 | Group 5 · Precision grouts | **PASS** | `src/data/categories.ts:162`<br>`src/data/brief.test.ts:15` | [CAT-27.png](screens/CAT-27.png) | — |
| CAT-28 | Group 5 · Anchors | **PASS** | `src/data/categories.ts:166`<br>`src/data/brief.test.ts:15` | [CAT-28.png](screens/CAT-28.png) | — |
| CAT-29 | Group 5 · Fibre wrap | **PASS** | `src/data/categories.ts:169`<br>`src/data/brief.test.ts:15` | [CAT-29.png](screens/CAT-29.png) | — |
| CAT-30 | Group 5 · Anti-corrosion and protective coatings | **PASS** | `src/data/categories.ts:172`<br>`src/data/brief.test.ts:15` | [CAT-30.png](screens/CAT-30.png) | — |
| CAT-31 | Group 6 · Fire protection (Intumescent coatings, firestop) | **PASS** | `src/data/categories.ts:177`<br>`src/data/brief.test.ts:16` | [CAT-31.png](screens/CAT-31.png) | — |
| CAT-32 | Group 6 · Tunnelling and mining chemicals | **PASS** | `src/data/categories.ts:181`<br>`src/data/brief.test.ts:16` | [CAT-32.png](screens/CAT-32.png) | — |
| CAT-33 | Group 6 · Construction adhesives and foams | **PASS** | `src/data/categories.ts:184`<br>`src/data/brief.test.ts:16` | [CAT-33.png](screens/CAT-33.png) | — |
| CAT-34 | A Competitors field exists in the data model per subcategory (empty in the brief). | **PASS** | `src/types.ts:30`<br>`src/data/categories.ts:38` | [CAT-34.png](screens/CAT-34.png) | — |
| CAT-35 | Lists live in one config file (a draft; see the open questions). | **PASS** | `src/data/categories.ts:50` | [CAT-35.png](screens/CAT-35.png) | — |
| MD-01 | Same engine, same brief output for both modes; only language and screens differ. | **PASS** | `src/features/intake/IntakeWizard.tsx:220`<br>`src/data/copy.ts:4` | [MD-01.png](screens/MD-01.png) | — |
| MD-02 | Language: Scientist technical (standards, classes, units, test methods); Non-scientist plain (site situations and outcomes). 10 labels each. | **PASS** | `src/data/copy.ts:4` | [MD-02.png](screens/MD-02.png) | — |
| MD-03 | Use case: Scientist structured fields + standard class (e.g. IS 15477 Type 4 T S2); Non-scientist question cards with pictures. | **PASS** | `src/features/intake/steps/StepUseCase.tsx:119` | [MD-03.png](screens/MD-03.png) | — |
| MD-04 | Closest benchmark (Scientist): pick from library, upload TDS, or enter own lab values; up to 3. | **PASS** | `src/features/intake/steps/StepBenchmark.tsx:302`<br>`src/features/intake/steps/StepBenchmark.tsx:307` | [MD-04.png](screens/MD-04.png) | — |
| MD-05 | Closest benchmark (Non-scientist): "Which product do you use or want to match?", optional. | **PASS** | `src/features/intake/steps/StepBenchmark.tsx:262` | [MD-05.png](screens/MD-05.png) | — |
| MD-06 | A preview of the summary of what we are formulating, based on the inputs. | **PASS** | `src/features/intake/steps/PreviewSummary.tsx:18` | [MD-06.png](screens/MD-06.png) | — |
| MD-07 | Targets (Scientist): editable table by target, operator, unit, test method, priority; sliders, options, min/max; grouped 1. Chemical 2. Rheological 3. Mechanical. | **PASS** | `src/components/tables/TargetsTable.tsx:279` | [MD-07.png](screens/MD-07.png) | — |
| MD-08 | Targets (Scientist): Top 3 ranking of the most important parameters to optimise. | **PASS** | `src/features/intake/steps/StepTargets.tsx:18` | [MD-08.png](screens/MD-08.png) | — |
| MD-09 | Targets (Non-scientist): editable table by target, operator, unit, test method, priority; grouped. | **PASS** | `src/components/tables/TargetsTable.tsx:279` | [MD-09.png](screens/MD-09.png) | — |
| MD-10 | Constraints (Scientist): cost ceiling, raw material limits, compliance, site conditions; sliders/options/min-max; remark for general constraints. | **PASS** | `src/features/intake/steps/StepConstraints.tsx:166` | [MD-10.png](screens/MD-10.png) | — |
| MD-11 | Constraints (Non-scientist): budget band (economy, mid, premium) and must-haves. | **PASS** | `src/features/intake/steps/StepConstraints.tsx:15` | [MD-11.png](screens/MD-11.png) | — |
| MD-12 | Processing: Literature review showcase and Synthesis pathways showcase (Novyte screenshot slot). | **PASS** | `src/features/intake/IntakeWizard.tsx:183` | [MD-12.png](screens/MD-12.png) | — |
| MD-13 | Output (Scientist): pathways, trial recipes, test plan, iteration. | **PASS** | `src/features/project/ProjectPage.tsx:30` | [MD-13.png](screens/MD-13.png) | — |
| MD-14 | Output (Non-scientist): recommended product spec and a brief to hand to R&D. | **PASS** | `src/features/project/ProjectPage.tsx:74` | [MD-14.png](screens/MD-14.png) | — |
| MD-15 | Both modes end on the same review screen: the full brief, then "Start formulation". | **PASS** | `src/data/copy.ts:41` | [MD-15.png](screens/MD-15.png) | — |
| MD-16 | Owner notes (Targets and Constraints owned by Atul) recorded in code comments or docs. | **PASS** | `src/features/intake/steps/StepTargets.tsx:64`<br>`src/features/intake/steps/StepConstraints.tsx:20` | — | — |
| WF-01 | One project page: the brief as a fixed header, then collapsible stages. | **PASS** | `src/features/project/BriefHeader.tsx:38`<br>`src/features/project/StageShell.tsx:29` | [WF-01.png](screens/WF-01.png) | — |
| WF-02 | Each stage has a status of waiting, running or complete. | **PASS** | `src/components/ui/Pill.tsx:33` | [WF-02.png](screens/WF-02.png) | — |
| WF-LIT-01 | Literature progress steps: Analyse, Identify, Strategy, Search, Cluster, Extract. | **PASS** | `src/agent/scripts/stages.ts:21` | [WF-LIT-01.png](screens/WF-LIT-01.png) | — |
| WF-LIT-02 | Source list of papers, patents, TDS, supplier sheets (type visible per source). | **PASS** | `src/components/ai/CitationChip.tsx:6` | [WF-LIT-02.png](screens/WF-LIT-02.png) | — |
| WF-LIT-03 | Literature actions: Open, Pin, Exclude, Upload own source. | **PASS** | `src/features/project/stages/StageLiterature.tsx:198` | [WF-LIT-03.png](screens/WF-LIT-03.png) | — |
| WF-PATH-01 | Pathways: ranked cards. | **PASS** | `src/features/project/stages/StagePathways.tsx:48` | [WF-PATH-01.png](screens/WF-PATH-01.png) | — |
| WF-PATH-02 | Card: composition sketch with dosage ranges. | **PASS** | `src/features/project/stages/StagePathways.tsx:81` | [WF-PATH-02.png](screens/WF-PATH-02.png) | — |
| WF-PATH-03 | Card: predicted values vs targets. | **PASS** | `src/features/project/stages/StagePathways.tsx:97` | [WF-PATH-03.png](screens/WF-PATH-03.png) | — |
| WF-PATH-04 | Card: scores — target match, cost, availability, overall. | **PASS** | `src/features/project/stages/StagePathways.tsx:118` | [WF-PATH-04.png](screens/WF-PATH-04.png) | — |
| WF-PATH-05 | Card: cost per kg. | **PASS** | `src/features/project/stages/StagePathways.tsx:122` | [WF-PATH-05.png](screens/WF-PATH-05.png) | — |
| WF-PATH-06 | Card: equipment. | **PASS** | `src/features/project/stages/StagePathways.tsx:135` | [WF-PATH-06.png](screens/WF-PATH-06.png) | — |
| WF-PATH-07 | Card: hazard and risk flags. | **PASS** | `src/features/project/stages/StagePathways.tsx:137` | [WF-PATH-07.png](screens/WF-PATH-07.png) | — |
| WF-PATH-08 | Card: citations. | **PASS** | `src/features/project/stages/StagePathways.tsx:143` | [WF-PATH-08.png](screens/WF-PATH-08.png) | — |
| WF-PATH-09 | Actions: Compare up to 3, Select, Request a variant. | **PASS** | `src/features/project/stages/StagePathways.tsx:164` | [WF-PATH-09.png](screens/WF-PATH-09.png) | — |
| WF-TRI-01 | Recipe table: ingredients as rows, trials as columns, % by weight. | **PASS** | `src/components/tables/RecipeTable.tsx:11` | [WF-TRI-01.png](screens/WF-TRI-01.png) | — |
| WF-TRI-02 | Shows total, cost per kg and constraint check. | **PASS** | `src/components/tables/RecipeTable.tsx:134` | [WF-TRI-02.png](screens/WF-TRI-02.png) | — |
| WF-TRI-03 | Shows mixing protocol and test plan. | **PASS** | `src/features/project/stages/StageTrials.tsx:112` | [WF-TRI-03.png](screens/WF-TRI-03.png) | — |
| WF-TRI-04 | Actions: edit cells, add or duplicate trial, swap material, export trial sheet. | **PASS** | `src/features/project/stages/StageTrials.tsx:95` | [WF-TRI-04.png](screens/WF-TRI-04.png) | — |
| WF-RES-01 | Results: grid of properties by trials. | **PASS** | `src/features/project/stages/StageResults.tsx:33` | [WF-RES-01.png](screens/WF-RES-01.png) | — |
| WF-RES-02 | Per cell: specimen readings, mean, failure mode, test date, photos. | **PASS** | `src/features/project/stages/StageResults.tsx:184` | [WF-RES-02.png](screens/WF-RES-02.png) | — |
| WF-RES-03 | Due dates for aged tests. | **PASS** | `src/features/project/stages/StageResults.tsx:73` | [WF-RES-03.png](screens/WF-RES-03.png) | — |
| WF-RES-04 | Actions: Enter, Paste from Excel. | **PASS** | `src/features/project/stages/StageResults.tsx:114` | [WF-RES-04.png](screens/WF-RES-04.png) | — |
| WF-ANA-01 | Target vs benchmark vs trial matrix with pass, borderline, fail. | **PASS** | `src/features/project/stages/StageAnalysis.tsx:30` | [WF-ANA-01.png](screens/WF-ANA-01.png) | — |
| WF-ANA-02 | Proposed next trials with changes highlighted. | **PASS** | `src/features/project/stages/StageAnalysis.tsx:174` | [WF-ANA-02.png](screens/WF-ANA-02.png) | — |
| WF-ANA-03 | Actions: accept, edit or reject next iteration. | **PASS** | `src/features/project/stages/StageAnalysis.tsx:193` | [WF-ANA-03.png](screens/WF-ANA-03.png) | — |
| WF-FIN-01 | Final: locked recipe, cost, test summary, sources, approval status. | **PASS** | `src/features/project/stages/StageFinal.tsx:143` | [WF-FIN-01.png](screens/WF-FIN-01.png) | — |
| WF-FIN-02 | Final actions: submit, approve, export. | **PASS** | `src/features/project/stages/StageFinal.tsx:174` | [WF-FIN-02.png](screens/WF-FIN-02.png) | — |
| WF-BG-01 | Long stages run in the background. | **PASS** | `src/agent/controller.ts:23` | [WF-BG-01.png](screens/WF-BG-01.png) | — |
| WF-BG-02 | A toast with "Review results" appears on completion. | **PASS** | `src/agent/notify.tsx:20` | [WF-BG-02.png](screens/WF-BG-02.png) | — |
| WF-BG-03 | A task queue lists running jobs. | **PASS** | `src/features/tasks/TasksPage.tsx:15`<br>`src/features/crew-monitor/CrewMonitor.tsx:21` | [WF-BG-03.png](screens/WF-BG-03.png) | — |
| PR-CH | Chemical: binder type and content, polymer type and content, polymer-to-cement ratio, water demand, pH, solids content, VOC, chloride, alkali, mix ratio, chemical resistance, shelf life, hazard class (13). | **PASS** | `src/data/properties.ts:14`<br>`src/data/brief.test.ts:28` | — | unit test src/data/brief.test.ts passes |
| PR-RH | Rheological: viscosity, yield stress, thixotropy, flow, sag, slip, open time, adjustability, pot life, setting time, water retention, wetting, fresh density, air content, bleeding (15). | **PASS** | `src/data/properties.ts:28`<br>`src/data/brief.test.ts:29` | — | unit test src/data/brief.test.ts passes |
| PR-ME | Mechanical: tensile adhesion (initial, water, heat, freeze-thaw), shear adhesion, compressive, flexural, transverse deformation, elongation, crack bridging, modulus, shrinkage, abrasion, hardness, pull-off bond. | **PASS** | `src/data/properties.ts:46`<br>`src/data/brief.test.ts:30` | — | unit test src/data/brief.test.ts passes |
| PR-DU | Durability: water absorption, permeability, vapour transmission, freeze-thaw, UV resistance, service temperature, efflorescence, coverage (8). | **PASS** | `src/data/properties.ts:64`<br>`src/data/brief.test.ts:31` | — | unit test src/data/brief.test.ts passes |
| PR-01 | Each subcategory loads its own subset of the library as the target table. | **PASS** | `src/data/categories.ts:38` | [PR-01.png](screens/PR-01.png) | — |
| PR-02 | Target row = property, test method, unit, standard limit, benchmark value, target (operator and value), priority (must, important, nice). | **PASS** | `src/types.ts:54`<br>`src/types.ts:3` | [PR-02.png](screens/PR-02.png) | — |
| PR-03 | The library is marked as a draft for R&D to confirm (editable via Templates or config). | **PASS** | `src/data/properties.ts:3`<br>`src/features/templates/TemplatesPage.tsx:15` | [PR-03.png](screens/PR-03.png) | — |
| MO-BEN-01 | Benchmark library: competitor products. | **PASS** | `src/features/benchmarks/BenchmarksPage.tsx:9` | [MO-BEN-01.png](screens/MO-BEN-01.png) | — |
| MO-BEN-02 | Values tagged TDS, MSDS or lab-tested. | **PASS** | `src/types.ts:98` | [MO-BEN-02.png](screens/MO-BEN-02.png) | — |
| MO-BEN-03 | Version history. | **PASS** | `src/features/benchmarks/BenchmarkDetail.tsx:128` | [MO-BEN-03.png](screens/MO-BEN-03.png) | — |
| MO-BEN-04 | PDF upload with extraction review. | **PASS** | `src/features/benchmarks/BenchmarkDetail.tsx:54` | [MO-BEN-04.png](screens/MO-BEN-04.png) | — |
| MO-RAW-01 | Raw material master: material, function, grade, supplier, price, stock, approval status, MSDS, alternatives. | **PASS** | `src/features/raw-materials/RawMaterialsPage.tsx:61` | [MO-RAW-01.png](screens/MO-RAW-01.png) | — |
| MO-RAW-02 | Excel import. | **PASS** | `src/features/raw-materials/RawMaterialsPage.tsx:75` | [MO-RAW-02.png](screens/MO-RAW-02.png) | — |
| MO-COL-01 | Roles: chemist, technician, reviewer, admin. | **PASS** | `src/types.ts:2` | [MO-COL-01.png](screens/MO-COL-01.png) | — |
| MO-COL-02 | Comments. | **PASS** | `src/features/project/Comments.tsx:24` | [MO-COL-02.png](screens/MO-COL-02.png) | — |
| MO-COL-03 | Approvals. | **PASS** | `src/features/project/stages/StageFinal.tsx:85` | [MO-COL-03.png](screens/MO-COL-03.png) | — |
| MO-COL-04 | Activity log. | **PASS** | `src/features/project/Comments.tsx:64` | [MO-COL-04.png](screens/MO-COL-04.png) | — |
| MO-REP-01 | Reports: trial sheet, results comparison, final dossier. | **PASS** | `src/lib/reports.ts:13` | [MO-REP-01.png](screens/MO-REP-01.png) | — |
| MO-REP-02 | Each report in PDF and Excel. | **PASS** | `src/features/reports/ReportsPage.tsx:62` | [MO-REP-02.png](screens/MO-REP-02.png) | — |
| MO-ASK-01 | Ask Helix: side panel on every screen. | **PASS** | `src/app/Layout.tsx:86` | [MO-ASK-01.png](screens/MO-ASK-01.png) | — |
| MO-ASK-02 | Aware of the open project (context shown and used). | **PASS** | `src/components/shell/AskHelixPanel.tsx:22` | [MO-ASK-02.png](screens/MO-ASK-02.png) | — |
| MO-ASK-03 | Proposed changes shown as a preview to accept. | **PASS** | `src/components/ai/DiffPreview.tsx:15` | [MO-ASK-03.png](screens/MO-ASK-03.png) | — |
| MO-ASK-04 | Answers cite sources. | **PASS** | `src/components/shell/AskHelixPanel.tsx:191` | [MO-ASK-04.png](screens/MO-ASK-04.png) | — |
| NAV-01 | Left sidebar: Projects, Benchmarks, Raw materials, Templates, Reports, Task queue. | **PASS** | `src/components/shell/Sidebar.tsx:13` | [NAV-01.png](screens/NAV-01.png) | — |
| NAV-02 | Breadcrumb. | **PASS** | `src/components/shell/TopBar.tsx:60` | [NAV-02.png](screens/NAV-02.png) | — |
| NAV-03 | Global search. | **PASS** | `src/components/shell/CommandPalette.tsx:13` | [NAV-03.png](screens/NAV-03.png) | — |
| NAV-04 | Mode switch (Scientist / Non-scientist) in global UI. | **PASS** | `src/components/shell/TopBar.tsx:83` | [NAV-04.png](screens/NAV-04.png) | — |
| VS-01 | Light, dense, data-first, like lab software (light default). | **PASS** | `src/store/ui.ts:8` | [VS-01.png](screens/VS-01.png) | — |
| VS-02 | One accent colour (status colours and avatar canvases exempt). | **PASS** | `src/styles/index.css:14`<br>`src/styles/index.css:19` | [VS-02.png](screens/VS-02.png) | — |
| VS-03 | Pass, borderline, fail shown by colour plus label. | **PASS** | `src/lib/status.ts:33` | [VS-03.png](screens/VS-03.png) | — |
| VS-04 | Tabular numerals. | **PASS** | `src/styles/index.css:72` | [VS-04.png](screens/VS-04.png) | — |
| VS-05 | Desktop only, 1280 px minimum (desktop-only message below). | **PASS** | `src/app/DesktopGuard.tsx:5` | [VS-05.png](screens/VS-05.png) | — |
| VS-06 | Optional dark theme. | **PASS** | `src/components/shell/TopBar.tsx:86` | [VS-06.png](screens/VS-06.png) | — |
| ST-01 | Empty. | **PASS** | `src/components/ui/StateFrame.tsx:35` | [ST-01.png](screens/ST-01.png) | — |
| ST-02 | Running. | **PASS** | `src/features/project/StageShell.tsx:54` | [ST-02.png](screens/ST-02.png) | — |
| ST-03 | Complete. | **PASS** | `src/components/ui/Pill.tsx:35` | [ST-03.png](screens/ST-03.png) | — |
| ST-04 | Failed. | **PASS** | `src/components/ui/StateFrame.tsx:54` | [ST-04.png](screens/ST-04.png) | — |
| ST-05 | Low confidence. | **PASS** | `src/components/ui/StateFrame.tsx:76` | [ST-05.png](screens/ST-05.png) | — |
| ST-06 | Validation error: recipe not 100 %. | **PASS** | `src/lib/validate.ts:34` | [ST-06.png](screens/ST-06.png) | — |
| ST-07 | Validation error: target below standard. | **PASS** | `src/lib/validate.ts:36` | [ST-07.png](screens/ST-07.png) | — |
| ST-08 | Validation error: cost over ceiling. | **PASS** | `src/lib/validate.ts:38` | [ST-08.png](screens/ST-08.png) | — |
| ST-09 | Results pending. | **PASS** | `src/features/project/stages/StageResults.tsx:49` | [ST-09.png](screens/ST-09.png) | — |
| ST-10 | Read-only. | **PASS** | `src/components/ui/StateFrame.tsx:96` | [ST-10.png](screens/ST-10.png) | — |
| OQ-01 | Final category and subcategory lists → single config file + Templates page. | **N/A-OPEN** | `src/data/categories.ts:50` | [OQ-01.png](screens/OQ-01.png) | configurable (open question in the brief) |
| OQ-02 | Property template per subcategory → editable template per subcategory. | **N/A-OPEN** | `src/store/templates.ts:1` | [OQ-02.png](screens/OQ-02.png) | configurable (open question in the brief) |
| OQ-03 | What a non-scientist receives → setting nonScientistOutput: 'spec' / 'full'. | **N/A-OPEN** | `src/store/ui.ts:20` | [OQ-03.png](screens/OQ-03.png) | configurable (open question in the brief) |
| OQ-04 | Standards at launch → multi-select setting; method codes filtered by it. | **N/A-OPEN** | `src/features/settings/SettingsPage.tsx:79` | [OQ-04.png](screens/OQ-04.png) | configurable (open question in the brief) |
| OQ-05 | Internal tool or offered to others → org/brand config, no hard-coded company names. | **N/A-OPEN** | `src/data/copy.ts:62` | [OQ-05.png](screens/OQ-05.png) | configurable (open question in the brief) |
| OQ-06 | Learn from our own past formulations → Settings toggle (UI only). | **N/A-OPEN** | `src/features/settings/SettingsPage.tsx:110` | [OQ-06.png](screens/OQ-06.png) | configurable (open question in the brief) |
| OQ-07 | Name styling, logo and brand colour → wordmark + accent isolated in brand tokens. | **N/A-OPEN** | `src/components/shell/Wordmark.tsx:3`<br>`src/styles/index.css:14` | [OQ-07.png](screens/OQ-07.png) | configurable (open question in the brief) |
| AX-01 | Orbs and bots never replace a brief-required label or status; statuses still use colour + text. | **PASS** | `src/components/ui/Pill.tsx:18` | [AX-01.png](screens/AX-01.png) | — |
| AX-02 | Agent animations are skippable, respect reduced motion, and never block a required action. | **PASS** | `src/components/ai/AgentConsole.tsx:177` | [AX-02.png](screens/AX-02.png) | — |
| AX-03 | AI-filled values remain fully editable and edits persist. | **PASS** | `src/features/intake/useDraft.ts:11` | [AX-03.png](screens/AX-03.png) | — |
| AX-04 | Bot avatar colours appear only inside avatars; the UI keeps one accent. | **PASS** | `src/components/agents/AgentBot.tsx:57` | [AX-04.png](screens/AX-04.png) | — |
| AX-05 | The Research preview (Processing step) still satisfies MD-12, including the Novyte screenshot slot. | **PASS** | `src/features/intake/IntakeWizard.tsx:183` | [AX-05.png](screens/AX-05.png) | — |
| AX-06 | Graphs and the Crew Monitor don't push any required sidebar item out of view at 1280 × 800. | **PASS** | `src/features/crew-monitor/CrewMonitor.tsx:46` | [AX-06.png](screens/AX-06.png) | — |

## Deviations kept on purpose (with justification)

- **AI layer (orbs, bots, agent console, typed narration, Crew Monitor, Graphs)** — approved add-on. Verified against the brief rules by AX-01…AX-06: statuses keep colour + label, animations are skippable and honour reduced motion, AI values stay editable, bot colours live only inside avatar canvases, required sidebar items stay visible at 1280 × 800.
- **Chart highlight colours** — Graphs marks the Best trial in orange and colours data by a sequential scale. These are data-visualisation encodings (like status colours), not UI accent; the Q Suggestion marker uses the UI accent token (`--suggest: var(--accent)`).
- **Desktop guard** — below 1280 px a desktop-only message covers the app (VS-05) with a "Continue anyway" link for the session; the layout still degrades gracefully rather than breaking.
- **Extra properties** (e.g. slump retention, water reduction, self-healing width, expansion) and extra nav item **Agents** — additions, allowed by the brief (NAV-01 permits extras; the library is a draft).
