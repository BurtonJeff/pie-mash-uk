// Looks up lat/lng for each row in shops-template.csv that has a postcode
// but no coordinates, using the free postcodes.io API.
// Run with: node docs/geocode-postcodes.js

const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, 'shops-template.csv');

function parseCSV(text) {
  const lines = text.split('\n');
  const headers = splitLine(lines[0]);
  return {
    headers,
    rows: lines.slice(1).filter(l => l.trim()).map(l => splitLine(l)),
  };
}

// Handles quoted fields containing commas
function splitLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function toCSVLine(fields) {
  return fields.map(f => {
    if (f.includes(',') || f.includes('"') || f.includes('\n')) {
      return '"' + f.replace(/"/g, '""') + '"';
    }
    return f;
  }).join(',');
}

async function bulkLookup(postcodes) {
  const res = await fetch('https://api.postcodes.io/postcodes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postcodes }),
  });
  const json = await res.json();
  const map = {};
  for (const item of json.result ?? []) {
    if (item.result) {
      map[item.query.trim().toUpperCase()] = {
        lat: item.result.latitude,
        lng: item.result.longitude,
      };
    }
  }
  return map;
}

async function main() {
  const text = fs.readFileSync(CSV_PATH, 'utf8');
  const { headers, rows } = parseCSV(text);

  const latIdx = headers.indexOf('latitude');
  const lngIdx = headers.indexOf('longitude');
  const pcIdx  = headers.indexOf('postcode');

  if (latIdx === -1 || lngIdx === -1 || pcIdx === -1) {
    console.error('Could not find required columns');
    process.exit(1);
  }

  // Collect postcodes that need looking up
  const toLookup = [];
  for (const row of rows) {
    const pc = (row[pcIdx] ?? '').trim();
    const lat = (row[latIdx] ?? '').trim();
    if (pc && !lat) toLookup.push(pc.toUpperCase());
  }

  console.log(`Looking up ${toUniq(toLookup).length} postcodes...`);

  // postcodes.io bulk endpoint accepts up to 100 at a time
  const chunks = chunkArray(toUniq(toLookup), 100);
  let coordMap = {};
  for (const chunk of chunks) {
    const result = await bulkLookup(chunk);
    coordMap = { ...coordMap, ...result };
  }

  let updated = 0;
  const newRows = rows.map(row => {
    const pc = (row[pcIdx] ?? '').trim().toUpperCase();
    const lat = (row[latIdx] ?? '').trim();
    if (pc && !lat && coordMap[pc]) {
      const clone = [...row];
      clone[latIdx] = coordMap[pc].lat.toFixed(6);
      clone[lngIdx] = coordMap[pc].lng.toFixed(6);
      updated++;
      return clone;
    }
    return row;
  });

  const output = [toCSVLine(headers), ...newRows.map(toCSVLine)].join('\n') + '\n';
  fs.writeFileSync(CSV_PATH, output, 'utf8');

  console.log(`Done. Updated ${updated} rows.`);
  const missing = toUniq(toLookup).filter(pc => !coordMap[pc]);
  if (missing.length) console.warn('Could not resolve:', missing.join(', '));
}

function toUniq(arr) { return [...new Set(arr)]; }
function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

main().catch(err => { console.error(err); process.exit(1); });
