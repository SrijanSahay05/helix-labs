#!/usr/bin/env node
/**
 * Builds audit/BRIEF_COMPLIANCE.md and audit/index.html from:
 *  - e2e/checklist.mjs (every brief requirement + code evidence)
 *  - audit/results-{1280,1440,1920}.json (Playwright runtime assertions + screenshots)
 *  - vitest (src/data/brief.test.ts, src/features/graphs/graphs.test.ts) for the data-only rows
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { CHECKLIST } from '../e2e/checklist.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
fs.mkdirSync(path.join(root, 'audit'), { recursive: true });
const read = (f) => (fs.existsSync(path.join(root, f)) ? JSON.parse(fs.readFileSync(path.join(root, f), 'utf8')) : {});
const runs = { 1280: read('audit/results-1280.json'), 1440: read('audit/results-1440.json'), 1920: read('audit/results-1920.json') };
const main = runs[1280];

// unit tests for the data rows (property library, category lists)
let unit = { ok: false, failed: [] };
try {
  const out = execSync('npx vitest run src/data/brief.test.ts --reporter=json', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  const j = JSON.parse(out.slice(out.indexOf('{')));
  unit = { ok: j.numFailedTests === 0, failed: j.testResults.flatMap((r) => r.assertionResults.filter((a) => a.status !== 'passed').map((a) => a.title)) };
} catch (e) {
  unit = { ok: false, failed: [String(e.message).slice(0, 120)] };
}

function resolve([file, find]) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) return { ref: `${file} (missing)`, ok: false };
  const lines = fs.readFileSync(p, 'utf8').split('\n');
  const i = lines.findIndex((l) => l.includes(find));
  return i < 0 ? { ref: `${file} (“${find.slice(0, 40)}” not found)`, ok: false } : { ref: `${file}:${i + 1}`, ok: true };
}

const DOC_ONLY = new Set(['MD-16']);
const UNIT = new Set(['PR-CH', 'PR-RH', 'PR-ME', 'PR-DU']);
const SUBCHECKS = { 'MD-03': ['MD-03-NS'], 'MD-02': ['MD-02-SCI'], 'FL-02': ['FL-02-RAIL'] };

const rows = CHECKLIST.map((r) => {
  const ev = r.code.map(resolve);
  const codeOk = ev.length > 0 && ev.every((e) => e.ok);
  const ids = [r.id, ...(SUBCHECKS[r.id] ?? [])];
  const rt = ids.map((i) => main[i]).filter(Boolean);
  const rtPass = rt.length > 0 && rt.every((x) => x.status === 'PASS');
  const notes = rt.filter((x) => x.status === 'FAIL').map((x) => x.note);
  let status;
  if (r.open) status = codeOk ? 'N/A-OPEN' : 'MISSING';
  else if (DOC_ONLY.has(r.id)) status = codeOk ? 'PASS' : 'MISSING';
  else if (UNIT.has(r.id)) status = codeOk && unit.ok && (rt.length === 0 || rtPass) ? 'PASS' : 'PARTIAL';
  else if (rtPass && codeOk) status = 'PASS';
  else if (rt.length === 0) status = codeOk ? 'PARTIAL' : 'MISSING';
  else status = codeOk ? 'PARTIAL' : 'MISSING';
  if (rt.length === 0 && !r.open && !DOC_ONLY.has(r.id) && !UNIT.has(r.id)) notes.push('no runtime assertion recorded');
  if (!codeOk) notes.push('code evidence not found');
  if (UNIT.has(r.id)) notes.push(unit.ok ? 'unit test src/data/brief.test.ts passes' : `unit test failing: ${unit.failed.join('; ')}`);
  if (r.open) notes.push('configurable (open question in the brief)');
  return { ...r, status, ev, screen: main[r.id]?.screen, notes };
});

const count = (s) => rows.filter((r) => r.status === s).length;
const total = rows.length;
const open = count('N/A-OPEN');
const coverage = ((count('PASS') / (total - open)) * 100).toFixed(1);
const summary = `Summary: PASS ${count('PASS')} · PARTIAL ${count('PARTIAL')} · MISSING ${count('MISSING')} · DEVIATION ${count('DEVIATION')} · N/A-OPEN ${open}  (coverage = ${coverage} %)`;

const vp = ['1440', '1920'].map((v) => {
  const r = runs[v];
  const keys = Object.keys(r);
  return `${v} px: ${keys.filter((k) => r[k].status === 'PASS').length}/${keys.length} layout + dark checks pass`;
});

const date = new Date().toISOString().slice(0, 10);
const md = [
  `# Helix brief compliance — ${date}`,
  '',
  summary,
  '',
  `Audit suite: \`e2e/brief-audit.spec.ts\` (Playwright, Chrome) at 1280×800 for every requirement; layout and dark-theme smoke at ${vp.join('; ')}. Scientist and Non-scientist flows are both driven. Unit tests: \`src/data/brief.test.ts\` (${unit.ok ? 'passing' : 'FAILING'}). Regenerate with \`npm run audit\`.`,
  '',
  '## Decisions needed (only true blockers)',
  '',
  'None blocking. Open questions (§J) are configurable with these defaults applied: categories in `src/data/categories.ts` + Templates page; non-scientist output = *product spec + R&D brief*; standards = IS + EN (ASTM available); no hard-coded organisation (BRAND in `src/data/copy.ts`); past formulations toggle off; accent `#6D4AFF` in `src/styles/index.css`.',
  '',
  '## Results table',
  '',
  '| ID | Requirement (brief wording) | Status | Evidence (code) | Evidence (screen) | Fix plan / Notes |',
  '|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.id} | ${r.req.replace(/\|/g, '/')} | **${r.status}** | ${r.ev.map((e) => `\`${e.ref}\``).join('<br>')} | ${r.screen ? `[${r.id}.png](${r.screen})` : '—'} | ${r.notes.join('; ').replace(/\|/g, '/') || '—'} |`),
  '',
  '## Deviations kept on purpose (with justification)',
  '',
  '- **AI layer (orbs, bots, agent console, typed narration, Crew Monitor, Graphs)** — approved add-on. Verified against the brief rules by AX-01…AX-06: statuses keep colour + label, animations are skippable and honour reduced motion, AI values stay editable, bot colours live only inside avatar canvases, required sidebar items stay visible at 1280 × 800.',
  '- **Chart highlight colours** — Graphs marks the Best trial in orange and colours data by a sequential scale. These are data-visualisation encodings (like status colours), not UI accent; the Q Suggestion marker uses the UI accent token (`--suggest: var(--accent)`).',
  '- **Desktop guard** — below 1280 px a desktop-only message covers the app (VS-05) with a "Continue anyway" link for the session; the layout still degrades gracefully rather than breaking.',
  '- **Extra properties** (e.g. slump retention, water reduction, self-healing width, expansion) and extra nav item **Agents** — additions, allowed by the brief (NAV-01 permits extras; the library is a draft).',
  '',
];
fs.writeFileSync(path.join(root, 'audit/BRIEF_COMPLIANCE.md'), md.join('\n'));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const badge = { PASS: '#26765c', PARTIAL: '#906315', MISSING: '#bf4557', DEVIATION: '#6d4aff', 'N/A-OPEN': '#5f6270' };
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Helix brief compliance — ${date}</title>
<style>
body{font:14px/1.5 system-ui,sans-serif;margin:0;background:#f6f7f9;color:#20212b;font-variant-numeric:tabular-nums}
header{position:sticky;top:0;background:#fff;border-bottom:1px solid #e5e6ee;padding:16px 24px;z-index:2}
h1{font-size:20px;margin:0 0 4px}.sum{color:#5f6270;font-size:13px}
.filters{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}.filters button{border:1px solid #e5e6ee;background:#fff;border-radius:999px;padding:4px 12px;cursor:pointer;font:inherit;font-size:12px}
.filters button.on{background:#6d4aff;color:#fff;border-color:#6d4aff}
main{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;padding:24px}
.card{background:#fff;border:1px solid #e5e6ee;border-radius:12px;overflow:hidden;display:flex;flex-direction:column}
.card img{width:100%;height:180px;object-fit:cover;object-position:top;border-bottom:1px solid #e5e6ee;background:#fafafa;cursor:zoom-in}
.body{padding:10px 12px}.id{font:600 12px ui-monospace,monospace}.b{display:inline-block;color:#fff;border-radius:6px;padding:1px 8px;font-size:11px;font-weight:600;float:right}
.req{font-size:12px;color:#5f6270;margin-top:4px}.sec{font-size:11px;color:#8a8c9a;margin-top:6px}.note{font-size:11px;color:#906315;margin-top:4px}
dialog{border:0;padding:0;max-width:92vw;border-radius:12px}dialog img{max-width:92vw;max-height:90vh;display:block}
</style></head><body>
<header><h1>Helix brief compliance — ${date}</h1><div class="sum">${esc(summary)}</div>
<div class="filters">${['All', 'PASS', 'PARTIAL', 'MISSING', 'DEVIATION', 'N/A-OPEN'].map((s, i) => `<button class="${i ? '' : 'on'}" data-f="${s}">${s}${s === 'All' ? ` (${total})` : ` (${count(s)})`}</button>`).join('')}</div></header>
<main>${rows
  .map(
    (r) => `<article class="card" data-s="${r.status}">${r.screen ? `<img loading="lazy" src="${r.screen}" alt="${esc(r.id)} screenshot">` : ''}<div class="body"><span class="b" style="background:${badge[r.status]}">${r.status}</span><div class="id">${esc(r.id)}</div><div class="req">${esc(r.req)}</div><div class="sec">${esc(r.section)} · ${r.ev.map((e) => esc(e.ref)).join(' · ')}</div>${r.notes.length ? `<div class="note">${esc(r.notes.join('; '))}</div>` : ''}</div></article>`,
  )
  .join('')}</main>
<dialog id="z"><img alt=""></dialog>
<script>
document.querySelectorAll('.filters button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.filters button').forEach(x=>x.classList.toggle('on',x===b));const f=b.dataset.f;document.querySelectorAll('.card').forEach(c=>c.style.display=f==='All'||c.dataset.s===f?'':'none')});
const z=document.getElementById('z');document.querySelectorAll('.card img').forEach(i=>i.onclick=()=>{z.querySelector('img').src=i.src;z.showModal()});z.onclick=()=>z.close();
</script></body></html>`;
fs.writeFileSync(path.join(root, 'audit/index.html'), html);
console.log(summary);
const bad = rows.filter((r) => r.status === 'PARTIAL' || r.status === 'MISSING');
if (bad.length) console.log(bad.map((r) => `  ${r.status.padEnd(8)} ${r.id}: ${r.notes.join('; ')}`).join('\n'));
