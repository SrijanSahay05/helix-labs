import { test, expect, type Page, type TestInfo } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { CATEGORY_ROWS } from './checklist.mjs';

/**
 * Brief compliance audit. Every requirement ID gets a runtime assertion and (at 1280 px) a screenshot in
 * audit/screens/{ID}.png. Results go to audit/results-{project}.json; scripts/audit-report.mjs builds the report.
 */

type Result = { status: 'PASS' | 'FAIL'; note?: string; screen?: string; viewport: string };
const results: Record<string, Result> = {};
const SCREENS = path.resolve('audit/screens');
fs.mkdirSync(SCREENS, { recursive: true });

let page: Page;
let info: TestInfo;
const primary = () => info.project.name === '1280';

/** Run one requirement's assertion, record it, and screenshot (optionally a locator). */
async function req(id: string, fn: () => Promise<void>, shot?: () => ReturnType<Page['locator']> | null) {
  const vp = info.project.name;
  try {
    await fn();
    results[id] = { status: 'PASS', viewport: vp };
  } catch (e) {
    // keep the first meaningful line, without terminal colour codes
    const msg = String((e as Error).message).replace(/\x1b\[[0-9;]*m/g, '');
    const lines = msg.split('\n').map((l) => l.trim()).filter(Boolean);
    const loc = lines.find((l) => l.startsWith('Locator:'));
    results[id] = { status: 'FAIL', note: `${lines[0]}${loc ? ` — ${loc}` : ''}`.slice(0, 240), viewport: vp };
  }
  if (primary()) {
    const file = path.join(SCREENS, `${id}.png`);
    try {
      const loc = shot?.();
      if (loc && (await loc.count())) await loc.first().screenshot({ path: file, timeout: 2500 });
      else await page.screenshot({ path: file });
      results[id].screen = `screens/${id}.png`;
    } catch {
      await page.screenshot({ path: file }).catch(() => {});
      results[id].screen = `screens/${id}.png`;
    }
  }
}

async function seed(p: Page, ui: Record<string, unknown> = {}) {
  await p.addInitScript((state) => {
    if (sessionStorage.getItem('audit-seeded')) return;
    sessionStorage.setItem('audit-seeded', '1');
    localStorage.clear();
    localStorage.setItem('helix:v1', JSON.stringify({ state: { modeRemembered: true, mode: 'scientist', speed: 'instant', autopilot: false, theme: 'light', ...state }, version: 0 }));
    sessionStorage.setItem('helix:crew-demo', '1');
  }, ui);
}

const t = (s: string | RegExp) => page.getByText(s).first();
const visible = async (s: string | RegExp) => expect(t(s)).toBeVisible({ timeout: 4000 });
const stepper = () => page.locator('nav[aria-label="Intake steps"]');
async function step(label: string) {
  await stepper().getByRole('button', { name: new RegExp(`\\b${label}$`) }).click();
  await page.waitForTimeout(500);
}
async function stage(id: string) {
  const sec = page.locator(`section#${id}`);
  // open stages render their body as `div.border-t.p-4` inside the section
  const open = await sec.locator('div.border-t.p-4').count();
  if (!open) await sec.locator('button').first().click();
  await sec.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  return sec;
}

test.describe.configure({ mode: 'serial', timeout: 300_000 });

test.beforeAll(async ({ browser }, ti) => {
  info = ti;
  const ctx = await browser.newContext({ viewport: ti.project.use.viewport ?? { width: 1280, height: 800 } });
  page = await ctx.newPage();
  await seed(page);
});

test.afterAll(async () => {
  const file = path.resolve(`audit/results-${info.project.name}.json`);
  const prev = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  fs.writeFileSync(file, JSON.stringify({ ...prev, ...results }, null, 2));
  await page.context().close();
});

/* ---------------- A/B/D: intake flow, Scientist ---------------- */
test('intake — scientist @full', async () => {
  await page.goto('/projects');
  await req('FL-01', async () => {
    await visible(/brief to locked recipe/i);
    await visible(/lab/i);
  });
  await req('NAV-01', async () => {
    for (const n of ['Projects', 'Benchmarks', 'Raw materials', 'Templates', 'Reports', 'Task queue']) await expect(page.getByLabel('Main').getByRole('link', { name: new RegExp(`^${n}`) })).toBeVisible();
  }, () => page.locator('aside').first());
  await req('AX-06', async () => {
    for (const n of ['Projects', 'Benchmarks', 'Raw materials', 'Templates', 'Reports', 'Task queue', 'Agents']) await expect(page.getByLabel('Main').getByRole('link', { name: new RegExp(`^${n}`) })).toBeInViewport();
    await expect(page.getByLabel('Crew monitor')).toBeVisible();
  }, () => page.locator('aside').first());
  await req('NAV-02', async () => expect(page.getByLabel('Breadcrumb')).toBeVisible(), () => page.locator('header').first());
  await req('NAV-04', async () => {
    await expect(page.getByRole('radio', { name: /^Scientist$/ }).first()).toBeVisible();
    await expect(page.getByRole('radio', { name: /^Non-scientist$/ }).first()).toBeVisible();
  }, () => page.locator('header').first());
  await req('NAV-03', async () => {
    await page.keyboard.press('Meta+k');
    await expect(page.getByPlaceholder(/search/i).first()).toBeVisible();
  });
  await page.keyboard.press('Escape');
  await req('VS-01', async () => {
    expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(false);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toMatch(/rgb\(24[0-9]|rgb\(25[0-5]/);
  });
  await req('VS-04', async () => {
    const v = await page.evaluate(() => [getComputedStyle(document.body).fontVariantNumeric, getComputedStyle(document.querySelector('td') ?? document.body).fontVariantNumeric]);
    for (const x of v) expect(x).toContain('tabular-nums');
  });
  await req('VS-02', async () => {
    // every element styled with the accent token resolves to the same hue
    const colours = await page.evaluate(() => {
      const out = new Set<string>();
      document.querySelectorAll('.bg-accent, .text-accent, .border-accent').forEach((el) => {
        const cs = getComputedStyle(el);
        const c = el.classList.contains('bg-accent') ? cs.backgroundColor : el.classList.contains('text-accent') ? cs.color : cs.borderColor;
        out.add(c.replace(/\s/g, '').replace(/,[0-9.]+\)$/, ')').replace('rgba', 'rgb'));
      });
      return [...out];
    });
    expect(colours.length).toBeLessThanOrEqual(1);
    const suggest = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--suggest').trim());
    const accent = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());
    expect(suggest).toBe(accent);
  });

  // Magic Start fills every step; then walk the stepper
  await page.goto('/projects/new');
  await page.getByPlaceholder(/Paste a link/).fill('https://example.com/c2te-s1-tile-adhesive-tds');
  await page.getByRole('button', { name: /Run Process/ }).click();
  await page.waitForTimeout(800);
  await page.keyboard.press('Escape');
  await expect(page.getByText(/Brief drafted/).first()).toBeVisible({ timeout: 30_000 });
  await req('AX-02', async () => {
    await expect(page.getByRole('button', { name: /Jump to review/ })).toBeEnabled();
  });

  await step('Who');
  await req('IN-01', async () => {
    const labels = await stepper().locator('li').allInnerTexts();
    const order = ['Who', 'Category', 'Subcategory', 'Use case', 'Benchmark', 'Preview', 'Targets', 'Constraints', 'Research', 'Review'];
    expect(labels.map((l) => l.replace(/^\d+\s*/, '').trim())).toEqual(order);
  }, () => stepper());
  await req('IN-02', async () => visible('Formulation brief'), () => page.locator('aside').filter({ hasText: 'Formulation brief' }));
  await req('IN-03', async () => {
    await expect(page.locator('[data-ai-target="mode:scientist"]')).toBeVisible();
    await expect(page.locator('[data-ai-target="mode:non-scientist"]')).toBeVisible();
    const b = await page.locator('[data-ai-target="mode:scientist"]').boundingBox();
    expect(b!.height).toBeGreaterThan(200);
  });
  await req('IN-04', async () => {
    const st = await page.evaluate(() => JSON.parse(localStorage.getItem('helix:v1')!).state);
    expect(st.modeRemembered).toBe(true);
    expect(st.mode).toBe('scientist');
  });

  await step('Category');
  await req('IN-06', async () => {
    await expect(page.getByPlaceholder(/Search all categories/)).toBeVisible();
    expect(await page.locator('[data-ai-path="categoryId"] button').count()).toBeGreaterThan(1);
  });
  await req('IN-07', async () => {
    const groups = await page.locator('[data-ai-path="group"] button').allInnerTexts();
    expect(groups.map((g) => g.replace(/^\d\s*/, '').trim())).toEqual(['Concrete and cement', 'Masonry and wall build-up', 'Waterproofing and sealing', 'Tile, stone and flooring', 'Repair, strengthening and protection', 'Specialty']);
  });
  // every brief category, group by group (C)
  for (const g of [1, 2, 3, 4, 5, 6]) {
    await page.locator(`[data-ai-target="group:${g}"]`).click();
    await page.waitForTimeout(250);
    for (const [id, group, name] of CATEGORY_ROWS.filter((r: [string, number, string]) => r[1] === g)) {
      await req(id, async () => {
        await expect(page.locator('[data-ai-path="categoryId"]').getByText(name, { exact: true })).toBeVisible();
        expect(group).toBe(g);
      }, () => page.locator('[data-ai-path="categoryId"]'));
    }
  }
  await req('CAT-34', async () => expect(fs.readFileSync('src/types.ts', 'utf8')).toContain('competitors?: string[]'));
  await req('CAT-35', async () => expect(fs.readFileSync('src/data/categories.ts', 'utf8')).toContain('export const CATEGORIES'));
  await page.locator('[data-ai-target="group:4"]').click();

  await step('Subcategory');
  await req('IN-08', async () => expect(page.locator('table tbody tr').first()).toBeVisible());
  await req('IN-09', async () => {
    await visible('Default standard');
    await visible(/Property template · \d+ properties/);
  });
  await req('IN-10', async () => {
    await visible('Chemistry');
    await visible('Physical form');
  });

  await step('Use case');
  await req('IN-11', async () => visible('Substrate'));
  const ucLabels: [string, string][] = [['IN-12a', 'Substrate'], ['IN-12b', 'Surface'], ['IN-12c', 'Tile or material type'], ['IN-12d', 'Interior or exterior'], ['IN-12e', 'Application temperature'], ['IN-12f', 'Load and traffic'], ['IN-12g', 'Application method'], ['IN-12h', 'Time to grout']];
  for (const [id, label] of ucLabels)
    await req(id, async () => {
      await expect(page.locator('.label', { hasText: label }).first()).toBeVisible();
      if (id === 'IN-12b') for (const s of ['Wall', 'Floor', 'Facade', 'Wet area', 'Submerged']) await expect(page.getByRole('button', { name: s, exact: true }).first()).toBeVisible();
      if (id === 'IN-12e') await expect(page.locator('.label', { hasText: 'Climate' }).first()).toBeVisible();
      if (id === 'IN-12h') await expect(page.locator('.label', { hasText: 'Time to traffic' }).first()).toBeVisible();
    }, () => page.locator('.label', { hasText: label }).first().locator('xpath=../..'));
  await req('MD-03', async () => {
    await visible('Standard class');
    await expect(page.locator('[data-ai-path="useCase.standardClass"] select')).toHaveValue(/IS 15477 Type 4 T S2/);
  });

  await step('Benchmark');
  await req('MD-04', async () => {
    for (const tab of ['Pick from library', 'Upload TDS', 'Enter own lab values']) await expect(page.getByRole('button', { name: tab })).toBeVisible();
    await visible(/\/ 3 benchmarks/);
  });

  await step('Preview');
  await req('MD-06', async () => expect(page.locator('[data-ai-path="summary"]')).toBeVisible());

  await step('Targets');
  await req('MD-07', async () => {
    for (const h of ['Operator', 'Value', 'Unit', 'Test method', 'Std limit', 'Benchmark']) await expect(page.locator('th', { hasText: h }).first()).toBeVisible();
    for (const g of ['1. Chemical', '2. Rheological', '3. Mechanical']) await expect(page.getByText(g, { exact: false }).first()).toBeVisible();
    await expect(page.locator('input[type="range"], input[type="number"]').first()).toBeAttached();
  });
  await req('PR-02', async () => {
    for (const h of ['Test method', 'Unit', 'Std limit', 'Benchmark', 'Operator', 'Value', 'Priority']) await expect(page.locator('th', { hasText: h }).first()).toBeVisible();
    const values = await page.locator('tbody select').filter({ has: page.locator('option[value="must"]') }).first().locator('option').evaluateAll((o) => o.map((x) => (x as HTMLOptionElement).value));
    expect(values).toEqual(['must', 'important', 'nice']);
  });
  await req('MD-08', async () => visible(/What should Helix optimise most/));
  await req('PR-01', async () => visible(/targets ·/));
  // ST-07: target below standard
  await req('ST-07', async () => {
    const row = page.locator('tr', { hasText: 'Tensile adhesion — initial' }).first();
    const input = row.locator('input[type="number"]').first();
    await input.fill('0.5');
    await input.blur();
    await expect(page.getByText(/Target below standard/).first()).toBeVisible();
  }, () => page.getByText(/Target below standard/).first().locator('xpath=ancestor::tr'));
  await req('AX-03', async () => {
    const row = page.locator('tr', { hasText: 'Tensile adhesion — initial' }).first();
    await expect(row.locator('input[type="number"]').first()).toHaveValue('0.5');
    await expect(row.getByText(/Edited by you/)).toBeVisible();
  });

  await step('Constraints');
  await req('MD-10', async () => {
    for (const l of ['Cost ceiling', 'Raw material limits', 'Compliance', 'Site conditions', 'Remark (general constraints)']) await expect(page.locator('.label', { hasText: l }).first()).toBeVisible();
    await expect(page.locator('input[type="range"]').first()).toBeVisible();
  });

  await step('Research');
  await req('MD-12', async () => {
    await visible(/Literature review/i);
    await visible(/Synthesis pathways|Recipe options/i);
  });
  await req('AX-05', async () => {
    await visible(/Literature review/i);
    await expect(page.getByRole('button', { name: /Continue to review|Skip preview/ }).first()).toBeVisible();
  });

  await step('Review');
  await req('MD-15', async () => expect(page.getByRole('button', { name: 'Start formulation' })).toBeVisible());
  await req('FL-02', async () => {
    const labels = await page.locator('nav[aria-label="Intake steps"] li').allInnerTexts();
    expect(labels.length).toBe(10);
  });
});

/* ---------------- D: Non-scientist mode ---------------- */
test('intake — non-scientist @full', async () => {
  await page.getByRole('radio', { name: /^Non-scientist$/ }).first().click();
  await page.waitForTimeout(400);
  await req('IN-05', async () => expect(await page.evaluate(() => JSON.parse(localStorage.getItem('helix:v1')!).state.mode)).toBe('non-scientist'));
  await step('Where used');
  await req('MD-03-NS', async () => {
    await expect(page.locator('[data-ai-path^="guided."]').first()).toBeVisible();
    await visible(/What Terra understood/);
  });
  await req('FL-03', async () => visible(/same brief in both modes/));
  await step('Match');
  await req('MD-05', async () => {
    await visible('Which product do you use or want to match?');
    await visible(/Skip — this is optional/);
  });
  await step('Performance');
  await req('MD-09', async () => {
    for (const h of ['Value', 'Unit']) await expect(page.locator('th', { hasText: h }).first()).toBeVisible();
    await expect(page.getByText(/^1\. /).first()).toBeVisible();
  });
  await step('Budget');
  await req('MD-11', async () => {
    for (const b of ['Economy', 'Mid', 'Premium']) await expect(page.getByText(b, { exact: true }).first()).toBeVisible();
    await expect(page.locator('.label', { hasText: 'Must-haves' }).first()).toBeVisible();
  });
  await req('MD-02', async () => {
    const plain = ['Where used', 'Performance', 'Budget', 'Check brief', 'Match', 'Product', 'Type', 'Summary', 'Getting ready'];
    const labels = (await stepper().innerText()).toLowerCase();
    for (const l of plain) expect(labels).toContain(l.toLowerCase());
  }, () => stepper());
  await step('Check brief');
  await req('MD-01', async () => expect(page.getByRole('button', { name: 'Start formulation' })).toBeVisible());
  await page.getByRole('radio', { name: /^Scientist$/ }).first().click();
  await page.waitForTimeout(300);
  await step('Review');
  await page.getByRole('button', { name: 'Start formulation' }).click();
  await page.waitForURL(/\/projects\/p-[a-z0-9]{5,}/);
  await req('MD-02-SCI', async () => {
    await visible('Literature');
    await visible('Synthesis pathways');
  });
});

/* ---------------- E: workflow on the seeded tile project ---------------- */
test('workflow @full', async () => {
  await page.goto('/projects/p-tile');
  await page.waitForTimeout(800);
  await req('WF-01', async () => {
    const pos = await page.locator('header.card').first().evaluate((el) => getComputedStyle(el).position);
    expect(pos).toBe('sticky');
    expect(await page.locator('section[id]').count()).toBe(6);
  });
  await req('WF-02', async () => {
    await expect(page.getByText('Complete', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Waiting', { exact: true }).first()).toBeVisible();
  });
  await req('ST-03', async () => expect(page.getByText('Complete', { exact: true }).first()).toBeVisible());
  await req('FL-02-RAIL', async () => {
    for (const n of ['Who', 'Category', 'Subcategory', 'Use case', 'Brief review', 'Literature', 'Pathways', 'Trials', 'Lab results', 'Targets met?', 'Final']) await expect(page.getByText(n, { exact: true }).first()).toBeAttached();
    await visible(/next iteration/);
  });

  const lit = await stage('literature');
  await req('WF-LIT-01', async () => {
    for (const s of ['Analyse', 'Identify', 'Strategy', 'Search', 'Cluster', 'Extract']) await expect(lit.getByText(s, { exact: true }).first()).toBeVisible();
  }, () => lit);
  await req('WF-LIT-02', async () => {
    for (const s of ['Paper', 'Patent', 'TDS', 'Supplier sheet']) await expect(lit.getByText(s, { exact: true }).first()).toBeAttached();
  }, () => lit);
  await req('WF-LIT-03', async () => {
    await expect(lit.getByTitle('Open').first()).toBeAttached();
    await expect(lit.getByTitle(/^(Pin|Unpin)$/).first()).toBeAttached();
    await expect(lit.getByTitle('Exclude').first()).toBeAttached();
    await expect(lit.getByRole('button', { name: /Upload own source/ })).toBeVisible();
  }, () => lit);

  const pw = await stage('pathways');
  const card = pw.locator('div.rounded-lg.border.bg-surface').first();
  const pathChecks: [string, () => Promise<void>][] = [
    ['WF-PATH-01', async () => expect(await pw.getByText(/^P[1-5]$/).count()).toBeGreaterThanOrEqual(3)],
    ['WF-PATH-02', async () => expect(card.getByText('Composition (% w/w)')).toBeVisible()],
    ['WF-PATH-03', async () => expect(card.getByText('Predicted vs target')).toBeVisible()],
    ['WF-PATH-04', async () => { for (const s of ['Target match', 'Cost', 'Availability', 'Overall']) await expect(card.getByText(s, { exact: true }).first()).toBeVisible(); }],
    ['WF-PATH-05', async () => expect(card.getByText('Cost / kg')).toBeVisible()],
    ['WF-PATH-06', async () => expect(card.getByText(/blender/i).first()).toBeVisible()],
    ['WF-PATH-07', async () => expect(card.getByText(/irritant|single-source/i).first()).toBeVisible()],
    ['WF-PATH-08', async () => expect(card.locator('button', { hasText: /^\[?\d+\]?$/ }).first()).toBeVisible()],
    ['WF-PATH-09', async () => { await expect(card.getByText('Compare')).toBeVisible(); await expect(card.getByRole('button', { name: /Select|Re-design/ })).toBeVisible(); await expect(card.getByRole('button', { name: /Request a variant/ })).toBeVisible(); }],
  ];
  for (const [id, fn] of pathChecks) await req(id, fn, () => card);
  await req('ST-08', async () => expect(pw.getByText(/Cost over ceiling/).first()).toBeVisible(), () => pw.getByText(/Cost over ceiling/).first().locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]'));

  const tr = await stage('trials');
  await req('WF-TRI-01', async () => {
    await expect(tr.locator('th', { hasText: /T1$/ }).first()).toBeVisible();
    await expect(tr.getByText(/OPC 53/).first()).toBeVisible();
  }, () => tr.locator('table').first());
  await req('WF-TRI-02', async () => {
    for (const r of ['Total', 'Cost / kg', 'Constraint check']) await expect(tr.getByText(r).first()).toBeVisible();
  }, () => tr.locator('tfoot').first());
  await req('WF-TRI-03', async () => {
    await expect(tr.getByText('Mixing protocol')).toBeVisible();
    await expect(tr.getByText('Test plan').first()).toBeVisible();
  });
  await req('WF-TRI-04', async () => {
    await expect(tr.getByRole('button', { name: /Add trial/ })).toBeVisible();
    await expect(tr.getByTitle(/Duplicate T1/)).toBeAttached();
    await expect(tr.getByRole('button', { name: /Swap material/ }).first()).toBeVisible();
    await expect(tr.getByRole('button', { name: /Export trial sheet/ })).toBeVisible();
    await expect(tr.locator('tbody input').first()).toBeAttached();
  });
  await req('ST-06', async () => {
    const cell = tr.locator('tbody input').first();
    const v = await cell.inputValue();
    await cell.fill(String(Number(v) + 2));
    await cell.blur();
    await expect(tr.getByText(/Recipe not 100 %/).first()).toBeVisible();
    await cell.fill(v);
    await cell.blur();
  }, () => tr.locator('tfoot').first());

  const rs = await stage('results');
  await req('WF-RES-01', async () => {
    await expect(rs.locator('th', { hasText: 'Property' }).first()).toBeVisible();
    await expect(rs.locator('[data-trial-col]').first()).toBeVisible();
  }, () => rs.locator('table').first());
  await req('WF-RES-03', async () => expect(rs.getByText(/due \d/i).first()).toBeVisible());
  await req('ST-09', async () => expect(rs.getByTitle('Results pending').first()).toBeVisible());
  await req('WF-RES-04', async () => {
    await expect(rs.getByRole('button', { name: /Paste from Excel/ })).toBeVisible();
    await expect(rs.getByTitle('Results pending').first()).toBeVisible();
  });
  await rs.getByTitle('Results pending').first().click();
  await req('WF-RES-02', async () => {
    for (const l of ['Specimen readings', 'Mean', 'Failure mode', 'Test date', 'Photos']) await expect(page.getByText(l, { exact: false }).first()).toBeVisible();
  }, () => page.locator('aside').filter({ hasText: 'Specimen readings' }));
  await page.keyboard.press('Escape');
  await page.locator('aside').filter({ hasText: 'Specimen readings' }).getByRole('button').first().click().catch(() => {});

  // run the lab loop: sample results → analysis → accept next iteration
  await rs.getByRole('button', { name: /Load sample lab results/ }).click();
  await page.waitForTimeout(2500);
  const an = await stage('analysis');
  await expect(an.getByRole('button', { name: /Accept next iteration/ })).toBeVisible({ timeout: 20_000 });
  await req('WF-ANA-01', async () => {
    await expect(an.locator('th', { hasText: 'Target' }).first()).toBeVisible();
    await expect(an.getByText(/^(Pass|Borderline|Fail)$/).first()).toBeVisible();
  }, () => an.locator('table').first());
  await req('WF-ANA-02', async () => visible(/changes highlighted/));
  await req('WF-ANA-03', async () => {
    await expect(an.getByRole('button', { name: /Accept next iteration/ })).toBeVisible();
    await expect(an.getByRole('button', { name: /^Edit$/ })).toBeVisible();
    await expect(an.getByRole('button', { name: /Reject next iteration/ })).toBeVisible();
  });
  await req('VS-03', async () => {
    const pills = await page.locator('[data-status]').allInnerTexts();
    expect(pills.length).toBeGreaterThan(0);
    for (const p of pills) expect(p.trim()).toMatch(/Pass|Borderline|Fail|Pending/);
  }, () => an.locator('table').first());
  await an.getByRole('button', { name: /Accept next iteration/ }).click();
  await page.waitForTimeout(2000);
  await req('FL-04', async () => expect(page.getByText(/Iteration 2/).first()).toBeVisible());
  await req('WF-BG-01', async () => {
    await page.goto('/projects/p-wp');
    await page.waitForTimeout(500);
    await page.goto('/benchmarks');
    await expect(page.getByRole('heading', { name: /Benchmark/ }).first()).toBeVisible();
  });
});

/* ---------------- Final, states via seeded projects ---------------- */
test('final + states @full', async () => {
  await page.goto('/projects/p-mc');
  await page.waitForTimeout(800);
  const fin = await stage('final');
  await req('WF-FIN-01', async () => {
    for (const s of ['Locked recipe', 'Test summary', 'Sources']) await expect(fin.getByText(s).first()).toBeVisible();
    await expect(fin.getByText(/₹ [\d.]+ \/ kg/).first()).toBeVisible();
    await expect(fin.getByText(/approved/i).first()).toBeVisible();
  }, () => fin);
  await req('WF-FIN-02', async () => {
    await expect(fin.getByRole('button', { name: /Export PDF/ })).toBeVisible();
    await expect(fin.getByRole('button', { name: /Export Excel/ })).toBeVisible();
    expect(fs.readFileSync('src/features/project/stages/StageFinal.tsx', 'utf8')).toMatch(/Lock & submit[\s\S]*Approve/);
  });
  await req('MO-COL-03', async () => expect(fin.getByText(/approved/i).first()).toBeVisible());
  await req('ST-10', async () => visible(/Read-only/));
  await req('MO-COL-04', async () => visible(/Activity · crew and team/));
  await req('MO-COL-02', async () => visible(/Comments · project/));
  await req('MD-13', async () => {
    for (const s of ['Pathways', 'Trials', 'Lab results']) await expect(page.locator('section[id] .font-display', { hasText: s }).first()).toBeVisible();
    await expect(page.getByText(/Iteration 2/).first()).toBeVisible();
  });

  await page.goto('/projects/p-pce');
  await page.waitForTimeout(800);
  await stage('literature');
  await req('ST-04', async () => expect(page.getByText('Failed', { exact: false }).first()).toBeVisible(), () => page.locator('[role="alert"], .border-fail\\/30').first());
  await page.goto('/projects/p-gyp');
  await page.waitForTimeout(800);
  await stage('pathways');
  await req('ST-05', async () => expect(page.getByText('Low confidence').first()).toBeVisible());
  await page.goto('/projects/p-epoxy');
  await page.waitForTimeout(800);
  await stage('pathways');
  await req('ST-01', async () => visible(/I design pathways once Lumen finishes/));
  await page.goto('/projects/p-wp');
  await page.waitForTimeout(800);
  await req('ST-02', async () => expect(page.getByText(/Running|Waiting/).first()).toBeVisible());

  // non-scientist output (OQ-03 default 'spec')
  await page.getByRole('radio', { name: /^Non-scientist$/ }).first().click();
  await page.waitForTimeout(300);
  await req('MD-14', async () => {
    await visible(/Recommended product spec/);
    await expect(page.getByRole('button', { name: /Brief to hand to R&D/ })).toBeVisible();
  });
  await page.getByRole('radio', { name: /^Scientist$/ }).first().click();
});

/* ---------------- G: modules ---------------- */
test('modules @full', async () => {
  await page.goto('/benchmarks');
  await req('MO-BEN-01', async () => visible(/Benchmark/));
  await page.locator('table tbody tr, a[href^="/benchmarks/"]').first().click();
  await page.waitForTimeout(500);
  await req('MO-BEN-02', async () => {
    await expect(page.getByText(/^TDS$/).first()).toBeVisible();
    expect(await page.getByText(/^(MSDS|Lab-tested)$/).count()).toBeGreaterThan(0);
  });
  await req('MO-BEN-03', async () => visible('Version history'));
  await req('MO-BEN-04', async () => expect(page.getByText(/Upload|TDS PDF|Drop a/i).first()).toBeVisible());

  await page.goto('/raw-materials');
  await req('MO-RAW-01', async () => {
    for (const h of ['Material', 'Function', 'Grade', 'Supplier', 'Price', 'Stock', 'Approval', 'MSDS', 'Alternatives']) await expect(page.locator('th', { hasText: h }).first()).toBeVisible();
  }, () => page.locator('table').first());
  await req('MO-RAW-02', async () => expect(page.getByRole('button', { name: /Import|Excel/ }).first()).toBeVisible());

  await page.goto('/settings');
  await req('MO-COL-01', async () => {
    for (const r of ['Chemist', 'Technician', 'Reviewer', 'Admin']) await expect(page.getByText(r, { exact: true }).first()).toBeVisible();
  });
  await req('OQ-03', async () => visible(/What a non-scientist receives/));
  await req('OQ-04', async () => {
    await visible(/Standards at launch/);
    for (const s of ['IS', 'EN', 'ASTM']) await expect(page.getByRole('button', { name: s, exact: true })).toBeVisible();
  });
  await req('OQ-06', async () => visible(/Use past formulations as context/));
  await req('VS-06', async () => {
    await page.getByRole('button', { name: 'Dark', exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true);
    await page.getByRole('button', { name: 'Light', exact: true }).click();
  });

  await page.goto('/templates');
  await req('OQ-01', async () => visible(/template/i));
  await req('OQ-02', async () => expect(page.getByText(/Helix suggest template|Add property/i).first()).toBeVisible());
  await req('PR-03', async () => expect(page.getByText(/draft|R&D/i).first()).toBeVisible());
  await req('OQ-05', async () => expect(fs.readFileSync('src/data/copy.ts', 'utf8')).toContain('export const BRAND'));
  await req('OQ-07', async () => {
    await expect(page.locator('aside img, aside svg').first()).toBeVisible();
    expect(fs.readFileSync('src/styles/index.css', 'utf8')).toContain('--accent:');
  });

  await page.goto('/reports');
  await req('MO-REP-01', async () => {
    for (const r of ['Trial sheet', 'Results comparison', 'Final dossier']) await expect(page.getByText(r, { exact: true }).first()).toBeVisible();
  });
  await req('MO-REP-02', async () => {
    await expect(page.getByRole('button', { name: 'PDF', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Excel', exact: true })).toBeVisible();
  });

  await page.goto('/tasks');
  await req('WF-BG-03', async () => visible(/Task queue/));

  // Ask Helix on every route
  const routes = ['/projects', '/benchmarks', '/raw-materials', '/templates', '/reports', '/tasks', '/agents', '/settings', '/projects/p-tile', '/projects/new'];
  await req('MO-ASK-01', async () => {
    for (const r of routes) {
      await page.goto(r);
      await page.getByRole('button', { name: /Ask Helix/ }).first().click();
      await expect(page.getByText('Ask Helix').last()).toBeVisible();
      await page.keyboard.press('Meta+j');
    }
  });
  await page.goto('/projects/p-tile#trials');
  await page.waitForTimeout(600);
  await page.keyboard.press('Meta+j');
  await req('MO-ASK-02', async () => visible('HX-TA-014'));
  await page.locator('textarea').last().fill('Raise MHEC in T2 to 0.40 %');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3000);
  await req('MO-ASK-03', async () => {
    await expect(page.getByText(/Proposed change/).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^Accept$/ }).last()).toBeVisible();
  }, () => page.locator('aside').last());
  await page.locator('textarea').last().fill('What is the strongest evidence for RDP dosage?');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3500);
  await page.locator('textarea').last().fill('Why did T1 fail heat ageing?');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(4000);
  await req('MO-ASK-04', async () => expect(page.locator('aside').last().getByText(/^\[?\d+\]?$/).first()).toBeVisible(), () => page.locator('aside').last());
  await page.keyboard.press('Meta+j');

  // background job toast with "Review results"
  await page.goto('/projects/p-tile#pathways');
  await page.waitForTimeout(500);
  const p2 = await stage('pathways');
  await p2.getByRole('button', { name: /Select & design trials|Re-design trials/ }).first().click();
  await req('WF-BG-02', async () => expect(page.getByRole('button', { name: 'Review results' }).first()).toBeVisible({ timeout: 20_000 }), () => page.locator('[data-sonner-toast]').first());
});

/* ---------------- H: visual + AI layer ---------------- */
test('visual @full', async () => {
  await page.goto('/projects/p-tile');
  await req('AX-01', async () => {
    const pills = await page.locator('[data-status]').allInnerTexts();
    for (const p of pills) expect(p.trim().length).toBeGreaterThan(0);
  });
  await req('AX-04', async () => {
    // bot colours live only inside the avatar canvases
    expect(await page.locator('canvas').count()).toBeGreaterThan(0);
    const outside = await page.evaluate(() => [...document.querySelectorAll('canvas')].filter((c) => !c.closest('[role="group"]') && !c.closest('[role="img"][aria-label^="Helix "]')).length);
    expect(outside).toBe(0);
  });
  await page.setViewportSize({ width: 1279, height: 800 });
  await page.reload();
  await req('VS-05', async () => {
    await expect(page.getByTestId('desktop-only')).toBeVisible();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(300);
    await expect(page.getByTestId('desktop-only')).toHaveCount(0);
  });
});

/* ---------------- 1440 / 1920 / dark smoke ---------------- */
test('layout smoke @all', async () => {
  const vp = info.project.name;
  for (const [route, name] of [['/projects', 'projects'], ['/projects/p-tile', 'project'], ['/projects/new', 'new']] as const) {
    await page.goto(route);
    await page.waitForTimeout(900);
    await req(`LAYOUT-${name}-${vp}`, async () => {
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
      await expect(page.getByLabel('Breadcrumb')).toBeVisible();
    });
  }
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.goto('/projects/p-tile');
  await page.getByRole('button', { name: /Toggle theme/ }).click();
  await page.waitForTimeout(500);
  await req(`DARK-${vp}`, async () => {
    expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toMatch(/rgb\((1[0-9]|2[0-9]|3[0-9]),/);
  });
  await page.getByRole('button', { name: /Toggle theme/ }).click();
});
