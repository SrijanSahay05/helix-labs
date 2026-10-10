import type { RawMaterial } from '@/types';

const M = (
  id: string,
  name: string,
  fn: string,
  grade: string,
  supplier: string,
  pricePerKg: number,
  stockKg: number,
  approval: RawMaterial['approval'],
  alternatives: string[] = [],
): RawMaterial => ({ id, name, fn, grade, supplier, pricePerKg, stockKg, approval, msdsUrl: `#msds-${id}`, alternatives });

/** Demo prices in ₹/kg — for R&D to confirm. Supplier names are placeholders. */
export const RAW_MATERIALS: RawMaterial[] = [
  M('opc53', 'OPC 53 grade', 'Binder', 'IS 269 53S', 'Supplier North', 8, 42000, 'approved', ['white-cement']),
  M('sand', 'Graded silica sand 0.1–0.5 mm', 'Filler / aggregate', '0.1–0.5 mm, washed', 'Supplier West', 2.5, 120000, 'approved'),
  M('caco3', 'Calcium carbonate 40 µm', 'Filler', '40 µm', 'Supplier West', 4, 18000, 'approved'),
  M('vae-rdp', 'VAE redispersible polymer powder', 'Flexibility / adhesion', 'Grade A, Tg 0 °C', 'Supplier Polymer-1', 230, 2600, 'approved', ['vae-rdp-b']),
  M('mhec', 'MHEC 40k mPa·s', 'Water retention / rheology', '40,000 mPa·s', 'Supplier Cellulose', 450, 900, 'approved', ['hpmc60']),
  M('ca-formate', 'Calcium formate', 'Accelerator', '98 %', 'Supplier Chem', 75, 3100, 'approved'),
  M('starch-ether', 'Starch ether', 'Anti-slip', 'High-substitution', 'Supplier Cellulose', 380, 420, 'approved'),
  M('defoamer', 'Powder defoamer', 'Air control', 'Mineral-oil on carrier', 'Supplier Chem', 600, 160, 'approved'),
  M('vae-rdp-b', 'VAE RDP grade B', 'Flexibility / adhesion', 'Grade B, Tg 4 °C', 'Supplier Polymer-2', 205, 1200, 'pending', ['vae-rdp']),
  M('hpmc60', 'HPMC 60k', 'Water retention / rheology', '60,000 mPa·s', 'Supplier Cellulose-2', 420, 700, 'approved', ['mhec']),
  M('white-cement', 'White cement', 'Binder', 'White, 90 % reflectance', 'Supplier North', 22, 6000, 'approved', ['opc53']),
  M('acrylic-rdp', 'Acrylic copolymer powder', 'Deformability', 'Low-Tg', 'Supplier Polymer-2', 310, 300, 'approved'),
  M('fly-ash', 'Fly ash (class F)', 'Pozzolan / cost', 'IS 3812', 'Supplier Power', 1.8, 25000, 'approved'),
  M('gypsum', 'Beta-hemihydrate gypsum', 'Binder', 'β-plaster', 'Supplier Gyp', 6.5, 30000, 'approved'),
  // Crystalline waterproofing
  M('cryst-active', 'Crystalline active blend', 'Pore-blocking catalyst', 'Silicate blend', 'Supplier Chem', 160, 1400, 'approved'),
  M('sodium-silicate', 'Sodium silicate powder', 'Reactive silicate', 'Modulus 2.0', 'Supplier Chem', 38, 2200, 'approved'),
  // Micro-concrete / grout
  M('agg-6', 'Graded aggregate 0–6 mm', 'Aggregate', '0–6 mm', 'Supplier West', 1.6, 90000, 'approved'),
  M('silica-fume', 'Silica fume', 'Densifier', '≥ 90 % SiO₂', 'Supplier Chem', 32, 4000, 'approved'),
  M('pce-powder', 'PCE powder', 'Superplasticiser', 'Spray-dried', 'Supplier Polymer-1', 520, 600, 'approved'),
  M('expansion', 'Plastic expansion agent', 'Non-shrink', 'Al-free', 'Supplier Chem', 140, 500, 'approved'),
  // PCE admixture (liquid)
  M('pce-liquid', 'PCE polymer 50 % solution', 'Water reducer', 'HPEG-based', 'Supplier Polymer-1', 118, 18000, 'approved'),
  M('gluconate', 'Sodium gluconate', 'Retarder', 'Technical', 'Supplier Chem', 85, 3000, 'approved'),
  M('water', 'Process water', 'Diluent', 'RO', 'In-house', 0.05, 999999, 'approved'),
  M('biocide', 'Isothiazolinone biocide', 'Preservative', '1.5 %', 'Supplier Chem', 240, 120, 'approved'),
  M('liq-defoamer', 'Liquid defoamer', 'Air control', 'Polyether', 'Supplier Chem', 310, 300, 'approved'),
  // Gypsum plaster
  M('gyp-retarder', 'Gypsum retarder (protein)', 'Retarder', 'Protein hydrolysate', 'Supplier Chem', 480, 150, 'approved'),
  M('perlite', 'Expanded perlite', 'Lightweight filler', '0–1 mm', 'Supplier Min', 28, 2000, 'approved'),
  M('lime', 'Hydrated lime', 'pH / workability', 'IS 712', 'Supplier Min', 9, 5000, 'approved'),
  // Epoxy grout
  M('epoxy-resin', 'Liquid epoxy resin (BPA)', 'Binder', 'EEW 185', 'Supplier Resin', 260, 3500, 'approved'),
  M('amine-hardener', 'Modified cycloaliphatic amine', 'Hardener', 'AHEW 95', 'Supplier Resin', 340, 1800, 'approved'),
  M('silica-flour', 'Silica flour 0.06–0.3 mm', 'Filler', 'Fine', 'Supplier West', 6, 30000, 'approved'),
  M('pigment', 'Pigment paste', 'Colour', 'Grey', 'Supplier Colour', 420, 200, 'approved'),
  M('reactive-diluent', 'Reactive diluent (C12–C14)', 'Viscosity control', 'AGE', 'Supplier Resin', 290, 400, 'pending'),
];

export const MAT: Record<string, RawMaterial> = Object.fromEntries(RAW_MATERIALS.map((m) => [m.id, m]));
