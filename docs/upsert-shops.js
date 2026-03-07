/**
 * upsert-shops.js
 *
 * Reads docs/shops-template.csv and upserts every row into the Supabase `shops`
 * table, using `slug` as the unique identifier (insert or update).
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=xxx node docs/upsert-shops.js
 *
 * Notes:
 *  - price_range defaults to 1 if the CSV cell is empty (DB requires 1–4)
 *  - is_active defaults to true if the CSV cell is empty
 *  - Duplicate slugs in the CSV are disambiguated automatically (scotts-orpington)
 *  - photo_url columns are not handled here (they go into shop_photos separately)
 */

const fs   = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const CSV_PATH = path.join(__dirname, 'shops-template.csv');

// ── CSV parser (handles quoted fields with embedded newlines / commas) ─────────

function parseCSV(text) {
  const rows   = [];
  let row      = [];
  let field    = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch   = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') { field += '"'; i++; }  // escaped quote
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      row.push(field);
      field = '';
    } else if ((ch === '\r' || ch === '\n') && !inQuotes) {
      if (ch === '\r' && next === '\n') i++;          // CRLF
      row.push(field);
      field = '';
      if (row.some(f => f !== '')) rows.push(row);   // skip blank lines
      row = [];
    } else {
      field += ch;
    }
  }
  // flush last field / row
  if (field || row.length) { row.push(field); if (row.some(f => f !== '')) rows.push(row); }

  const headers = rows[0];
  const data    = rows.slice(1);
  return { headers, data };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function col(headers, row, name) {
  const idx = headers.indexOf(name);
  return idx >= 0 ? (row[idx] ?? '').trim() : '';
}

function parseBool(val) {
  if (!val) return null;
  return val.toUpperCase() === 'TRUE';
}

function parseNum(val) {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

/**
 * Parse a CSV hours string into the DayHours object the app expects:
 *   { open: "HH:MM", close: "HH:MM", closed: false }
 *   { open: "",       close: "",       closed: true  }
 * Returns null if the cell is empty (day omitted from the JSON).
 */
function parseDayHours(raw) {
  if (!raw) return null;

  // Normalise Unicode dashes / replacement chars → plain hyphen
  const s = raw
    .replace(/\uFFFD/g, '-')
    .replace(/[–—]/g, '-')
    .trim();

  if (!s || s.toUpperCase() === 'CLOSED') {
    return { open: '', close: '', closed: true };
  }

  // Match "HH:MM - HH:MM" or "HH:MM-HH:MM"
  const m = s.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  if (m) {
    return { open: m[1], close: m[2], closed: false };
  }

  // Unrecognised format — treat as closed rather than crash
  return { open: '', close: '', closed: true };
}

function buildOpeningHours(headers, row) {
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const full  = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const hours = {};
  for (let i = 0; i < days.length; i++) {
    const parsed = parseDayHours(col(headers, row, `${days[i]}_hours`));
    if (parsed !== null) hours[full[i]] = parsed;
  }
  return hours;
}

function buildFeatures(headers, row) {
  const map = {
    feat_eat_in:        'eat_in',
    feat_takeaway:      'takeaway',
    feat_card_payments: 'card_payments',
    feat_jellied_eels:  'jellied_eels',
    feat_vegetarian:    'vegetarian',
  };
  const features = {};
  for (const [csvCol, key] of Object.entries(map)) {
    const val = parseBool(col(headers, row, csvCol));
    if (val !== null) features[key] = val;
  }
  return features;
}

function slugify(raw) {
  // Replace spaces with hyphens and lower-case
  return raw.replace(/\s+/g, '-').toLowerCase();
}

// ── Transform CSV rows → shop objects ────────────────────────────────────────

function rowToShop(headers, row) {
  const name     = col(headers, row, 'name');
  const rawSlug  = col(headers, row, 'slug');
  const slug     = slugify(rawSlug);

  const priceRaw = col(headers, row, 'price_range');
  let   priceRange = parseInt(priceRaw, 10);
  if (isNaN(priceRange) || priceRange < 1 || priceRange > 4) priceRange = 1;

  const isActiveRaw = col(headers, row, 'is_active');
  const is_active   = isActiveRaw === '' ? true : (isActiveRaw.toUpperCase() === 'TRUE');

  const foundedRaw  = col(headers, row, 'founded_year');
  const founded_year = foundedRaw ? parseInt(foundedRaw, 10) : null;

  return {
    name,
    slug,
    description:   col(headers, row, 'description'),
    address_line1: col(headers, row, 'address_line1'),
    address_line2: col(headers, row, 'address_line2') || null,
    city:          col(headers, row, 'city'),
    postcode:      col(headers, row, 'postcode'),
    latitude:      parseNum(col(headers, row, 'latitude')),
    longitude:     parseNum(col(headers, row, 'longitude')),
    phone:         col(headers, row, 'phone')   || null,
    website:       col(headers, row, 'website') || null,
    email:         col(headers, row, 'email')   || null,
    facebook_url:  col(headers, row, 'facebook') || null,
    founded_year:  isNaN(founded_year) ? null : founded_year,
    price_range:   priceRange,
    is_active,
    opening_hours: buildOpeningHours(headers, row),
    features:      buildFeatures(headers, row),
  };
}

// ── Disambiguate duplicate slugs ──────────────────────────────────────────────

function deduplicateSlugs(shops) {
  const seen = new Map(); // slug → count
  for (const shop of shops) {
    if (seen.has(shop.slug)) {
      const count = seen.get(shop.slug) + 1;
      seen.set(shop.slug, count);
      const newSlug = `${shop.slug}-${count}`;
      console.warn(`  ⚠  Duplicate slug "${shop.slug}" for "${shop.name}" → renamed to "${newSlug}"`);
      shop.slug = newSlug;
      shop.name = `${shop.name} (${count})`;
    } else {
      seen.set(shop.slug, 1);
    }
  }
}

// ── Upsert via Supabase REST API ──────────────────────────────────────────────

async function upsertShops(shops) {
  const url = `${SUPABASE_URL}/rest/v1/shops?on_conflict=slug`;
  const res  = await fetch(url, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey':        SUPABASE_KEY,
      'Prefer':        'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(shops),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upsert failed (${res.status}): ${text}`);
  }

  return await res.json();
}

// ── Deactivate shops not in the CSV ──────────────────────────────────────────

async function deactivateMissingShops(csvSlugs) {
  const slugSet = new Set(csvSlugs);

  // Fetch all active shop slugs from DB
  const url = `${SUPABASE_URL}/rest/v1/shops?select=id,slug&is_active=eq.true`;
  const res  = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey':        SUPABASE_KEY,
    },
  });
  if (!res.ok) throw new Error(`Fetch slugs failed (${res.status}): ${await res.text()}`);

  const dbShops = await res.json();
  const toDeactivate = dbShops.filter(s => !slugSet.has(s.slug));

  if (toDeactivate.length === 0) {
    console.log('No shops to deactivate.');
    return;
  }

  const ids = toDeactivate.map(s => s.id);
  console.log(`Deactivating ${ids.length} shop(s) not in CSV:`);
  toDeactivate.forEach(s => console.log(`  - ${s.slug}`));

  const patchUrl = `${SUPABASE_URL}/rest/v1/shops?id=in.(${ids.join(',')})`;
  const patchRes = await fetch(patchUrl, {
    method:  'PATCH',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey':        SUPABASE_KEY,
      'Prefer':        'return=representation',
    },
    body: JSON.stringify({ is_active: false }),
  });
  if (!patchRes.ok) throw new Error(`Deactivate failed (${patchRes.status}): ${await patchRes.text()}`);
  console.log(`Deactivated ${ids.length} shop(s).`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const csv  = fs.readFileSync(CSV_PATH, 'utf8');
  const { headers, data } = parseCSV(csv);

  console.log(`Parsed ${data.length} rows from CSV.\n`);

  const shops = data
    .map(row => rowToShop(headers, row))
    .filter(s => s.name && s.slug && s.latitude !== null && s.longitude !== null);

  console.log(`${shops.length} valid rows to upsert (${data.length - shops.length} skipped — missing name/slug/coords).\n`);

  deduplicateSlugs(shops);

  // Send in batches of 50 to avoid huge payloads
  const BATCH = 50;
  let total = 0;
  for (let i = 0; i < shops.length; i += BATCH) {
    const batch  = shops.slice(i, i + BATCH);
    const result = await upsertShops(batch);
    total += result.length;
    console.log(`  Upserted rows ${i + 1}–${i + batch.length} (${result.length} returned)`);
  }

  console.log(`\nDone. ${total} shops upserted.\n`);

  // Deactivate any DB shops whose slug is no longer in the CSV
  const csvSlugs = shops.map(s => s.slug);
  await deactivateMissingShops(csvSlugs);
}

main().catch(err => { console.error(err); process.exit(1); });
