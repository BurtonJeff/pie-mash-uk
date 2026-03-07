// Applies researched contact data to shops-template.csv
// Run with: node docs/apply-contact-data.js

const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, 'shops-template.csv');

// Researched contact data keyed by a unique identifier (name + partial address)
// phone/website/email: only set if found — empty string means "leave as-is"
const CONTACTS = [
  { match: 'Arments - Walworth',                   phone: '020 7703 4974',   website: 'https://armentspieandmash.com',              email: 'mail@armentspieandmash.com' },
  { match: 'Barney',                                phone: '020 3581 1677',   website: '',                                           email: '' },
  { match: "BJ's - Canning Town",                  phone: '020 7474 3389',   website: '',                                           email: '' },
  { match: 'Brooke - Dagenham',                     phone: '020 8593 5039',   website: '',                                           email: '' },
  { match: 'Bush - Shepherds Bush',                 phone: '020 3876 5318',   website: 'https://www.bushpieandmash.co.uk',           email: '' },
  { match: 'Castles - Camden',                      phone: '020 7485 2196',   website: '',                                           email: '' },
  { match: 'Cathedral Pie Shop',                    phone: '07932 865835',    website: '',                                           email: '' },
  { match: 'Cockneys - Croydon',                    phone: '020 8680 4512',   website: '',                                           email: '' },
  { match: 'Cockneys - Portobello',                 phone: '020 8960 9409',   website: '',                                           email: '' },
  { match: 'Covs - Clacton',                        phone: '01255 420142',    website: 'https://the-pie-mash-shop.edan.io',          email: '' },
  { match: 'Eastenders',                            phone: '020 7515 4553',   website: 'https://www.eastenderspieandmash.com',       email: '' },
  { match: 'F Cooke - Bishops Stortford',           phone: '07802 793433',    website: '',                                           email: '' },
  { match: 'F Cooke - Hoxton',                      phone: '020 7729 7718',   website: '',                                           email: '' },
  { match: "Flo's Pie & Mash - Bexley",             phone: '020 4619 2515',   website: '',                                           email: '' },
  { match: "Flo's Pie & Mash - Folkstone",          phone: '01227 851279',    website: '',                                           email: '' },
  { match: "Flo's Pie & Mash - Crayford",           phone: '01322 403017',    website: 'https://flos-pie-mash.edan.io',              email: '' },
  { match: "G Kelly",                               phone: '020 8980 3165',   website: 'https://www.gkelly.london',                  email: '' },
  { match: 'Goddards',                              phone: '020 8305 9612',   website: 'https://www.goddardsatgreenwich.co.uk',      email: 'info@goddardsatgreenwich.co.uk' },
  { match: 'Golden Pie',                            phone: '020 7924 6333',   website: '',                                           email: '' },
  { match: "Heath's",                               phone: '020 8592 1091',   website: '',                                           email: '' },
  { match: "Hughes",                                phone: '01895 638978',    website: '',                                           email: 'hughespieandmash@gmail.com' },
  { match: "Lawrence",                              phone: '01895 470609',    website: '',                                           email: '' },
  { match: "Lucy's",                                phone: '07376 887377',    website: '',                                           email: '' },
  { match: 'M Manze - Peckham',                     phone: '020 7277 6181',   website: 'https://www.manze.co.uk',                   email: '' },
  { match: 'M Manze - Sutton',                      phone: '020 8286 8787',   website: 'https://www.manze.co.uk',                   email: '' },
  { match: 'M Manze - Tower Bridge',                phone: '+44 20 7407 2985',website: 'https://www.manze.co.uk',                   email: '' },
  { match: 'Manze - Hoddesdon',                     phone: '01992 446962',    website: '',                                           email: '' },
  { match: "Manze's - Great Dunmow",                phone: '07754 070381',    website: '',                                           email: '' },
  { match: 'Manze - Braintree',                     phone: '01376 619285',    website: 'https://www.manze.co.uk',                   email: '' },
  { match: "Maureen's",                             phone: '07768 628052',    website: 'https://maureenspieandmash.co.uk',           email: 'maureenspiemash@gmail.com' },
  { match: 'Millers',                               phone: '07834 586370',    website: '',                                           email: '' },
  { match: 'Motties',                               phone: '01322 667333',    website: '',                                           email: '' },
  { match: 'Noted',                                 phone: '020 8539 2499',   website: 'https://www.notedeelandpiehouse.co.uk',      email: '' },
  { match: 'Pie & Mash - Welling',                  phone: '020 8303 5122',   website: 'https://www.piemashwelling.co.uk',           email: '' },
  { match: 'Polly',                                 phone: '01376 618707',    website: 'http://pollyspieandmash.co.uk',              email: '' },
  { match: "Porsha",                                phone: '07398 097941',    website: 'https://www.porshaspieandmash.co.uk',        email: '' },
  { match: 'Raymonds',                              phone: '020 8850 9062',   website: '',                                           email: '' },
  { match: 'Robins - Romford',                      phone: '01708 752552',    website: 'https://www.robinspienmash.com',             email: '' },
  { match: 'Robins - Wanstead',                     phone: '020 8989 1988',   website: 'https://www.robinspienmash.com',             email: '' },
  { match: 'Robins - Southend',                     phone: '01702 436396',    website: 'https://www.robinspienmash.com',             email: '' },
  { match: 'Robins - Chelmsford',                   phone: '01245 491274',    website: 'https://www.robinspienmash.com',             email: '' },
  { match: 'Robins - Chingford',                    phone: '020 8524 1824',   website: 'https://www.robinspienmash.com',             email: '' },
  { match: 'Robins - Basildon',                     phone: '01268 271713',    website: 'https://www.robinspienmash.com',             email: '' },
  { match: "S&R Kelly",                             phone: '020 7739 8676',   website: '',                                           email: '' },
  // Two Scotts entries — differentiate by postcode substring in the address field
  { match: 'scotts-orpington-walnuts',              phone: '01689 876744',    website: '',                                           email: '' },
  { match: 'scotts-orpington-cotmandene',           phone: '020 8325 3634',   website: '',                                           email: '' },
  { match: "Sie's",                                 phone: '01474 364867',    website: '',                                           email: '' },
  { match: "Stacey's",                              phone: '01268 555857',    website: '',                                           email: '' },
  { match: 'T&J Kelly',                             phone: '020 8508 7113',   website: '',                                           email: '' },
  { match: 'Crafty Cockney',                        phone: '',                website: 'https://www.thecraftycockneypieandmash.com', email: '' },
  { match: "T's Pie",                               phone: '07962 525862',    website: 'https://www.ts-pie-n-mash.co.uk',           email: 'tony@ts-pie-n-mash.co.uk' },
  { match: 'Old Cockney',                           phone: '07873 589552',    website: '',                                           email: '' },
  { match: 'Pie Den',                               phone: '07950 378042',    website: '',                                           email: 'thepieden@gmail.com' },
  { match: 'Tony',                                  phone: '01992 652798',    website: '',                                           email: '' },
  { match: "Wally",                                 phone: '07727 296470',    website: '',                                           email: '' },
  { match: 'Whites',                                phone: '01255 675612',    website: 'https://www.whitespieandmash.co.uk',         email: '' },
  { match: "Young's",                               phone: '01621 842859',    website: 'https://www.maldonpieandmash.com',           email: 'info@maldonpieandmash.com' },
];

function parseCSV(text) {
  const lines = text.split('\n');
  const headers = splitLine(lines[0]);
  return {
    headers,
    rows: lines.slice(1).filter(l => l.trim()).map(l => splitLine(l)),
  };
}

function splitLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
    else { current += ch; }
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

function findContact(name, address1) {
  const nameLower = name.toLowerCase();
  const addr1Lower = (address1 || '').toLowerCase();

  // Special case: two Scotts - Orpington rows
  if (nameLower.includes('scotts') && nameLower.includes('orpington')) {
    if (addr1Lower.includes('walnuts') || addr1Lower.includes('br6')) {
      return CONTACTS.find(c => c.match === 'scotts-orpington-walnuts');
    }
    return CONTACTS.find(c => c.match === 'scotts-orpington-cotmandene');
  }

  return CONTACTS.find(c => {
    const m = c.match.toLowerCase();
    return nameLower.includes(m) || m.split(' ').every(word => nameLower.includes(word));
  });
}

function main() {
  const text = fs.readFileSync(CSV_PATH, 'utf8');
  const { headers, rows } = parseCSV(text);

  const phoneIdx   = headers.indexOf('phone');
  const websiteIdx = headers.indexOf('website');
  const emailIdx   = headers.indexOf('email');
  const nameIdx    = headers.indexOf('name');
  const addr1Idx   = headers.indexOf('address_line1');

  let updated = 0;

  const newRows = rows.map(row => {
    const name  = row[nameIdx]  ?? '';
    const addr1 = row[addr1Idx] ?? '';
    const contact = findContact(name, addr1);
    if (!contact) return row;

    const clone = [...row];
    let changed = false;

    if (contact.phone   && !clone[phoneIdx])   { clone[phoneIdx]   = contact.phone;   changed = true; }
    if (contact.website && !clone[websiteIdx]) { clone[websiteIdx] = contact.website; changed = true; }
    if (contact.email   && !clone[emailIdx])   { clone[emailIdx]   = contact.email;   changed = true; }

    if (changed) updated++;
    return clone;
  });

  const output = [toCSVLine(headers), ...newRows.map(toCSVLine)].join('\n') + '\n';
  fs.writeFileSync(CSV_PATH, output, 'utf8');
  console.log(`Done. Updated ${updated} rows.`);
}

main();
