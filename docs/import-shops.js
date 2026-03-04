/**
 * import-shops.js
 *
 * Reads docs/shops-template.csv and inserts/upserts rows into Supabase.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=xxx node docs/import-shops.js
 *
 * Requires Node >= 18 (fetch built-in) and the csv-parse package:
 *   npm install csv-parse
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/** Parse "HH:MM-HH:MM" or "CLOSED" into a DayHours object. */
function parseHours(value) {
  if (!value || value.trim().toUpperCase() === 'CLOSED') {
    return { open: '00:00', close: '00:00', closed: true };
  }
  const [open, close] = value.trim().split('-');
  return { open: open.trim(), close: close.trim(), closed: false };
}

function rowToShop(row) {
  const opening_hours = {};
  DAYS.forEach((d, i) => {
    opening_hours[DAY_NAMES[i]] = parseHours(row[`${d}_hours`]);
  });

  const features = {
    eat_in: row.feat_eat_in?.toUpperCase() === 'TRUE',
    takeaway: row.feat_takeaway?.toUpperCase() === 'TRUE',
    card_payments: row.feat_card_payments?.toUpperCase() === 'TRUE',
    jellied_eels: row.feat_jellied_eels?.toUpperCase() === 'TRUE',
    vegetarian: row.feat_vegetarian?.toUpperCase() === 'TRUE',
  };

  return {
    name: row.name.trim(),
    slug: row.slug.trim(),
    description: row.description?.trim() ?? '',
    address_line1: row.address_line1.trim(),
    address_line2: row.address_line2?.trim() || null,
    city: row.city.trim(),
    postcode: row.postcode.trim(),
    latitude: parseFloat(row.latitude),
    longitude: parseFloat(row.longitude),
    phone: row.phone?.trim() || null,
    website: row.website?.trim() || null,
    email: row.email?.trim() || null,
    founded_year: row.founded_year ? parseInt(row.founded_year, 10) : null,
    price_range: parseInt(row.price_range, 10),
    is_active: row.is_active?.toUpperCase() !== 'FALSE',
    opening_hours,
    features,
  };
}

async function upsertShops(shops) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/shops`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify(shops),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error ${res.status}: ${text}`);
  }
  return res;
}

async function main() {
  const csvPath = path.join(__dirname, 'shops-template.csv');
  const content = fs.readFileSync(csvPath, 'utf8');

  const rows = parse(content, { columns: true, skip_empty_lines: true, trim: true });
  console.log(`Parsed ${rows.length} shop(s) from CSV.`);

  const shops = rows.map(rowToShop);
  await upsertShops(shops);
  console.log(`Upserted ${shops.length} shop(s) successfully.`);

  // Report any photo URLs to upload manually
  rows.forEach((row) => {
    const photos = [row.photo_url_1, row.photo_url_2, row.photo_url_3].filter(Boolean);
    if (photos.length > 0) {
      console.log(`  Photos for "${row.name}": ${photos.join(', ')}`);
    }
  });
}

main().catch((err) => { console.error(err); process.exit(1); });
