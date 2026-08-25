import { access, copyFile } from 'node:fs/promises';
import { constants } from 'node:fs';

try {
  await access('.clasp.json', constants.F_OK);
  console.log('.clasp.json already exists. Run: npm run push');
} catch {
  await copyFile('.clasp.example.json', '.clasp.json');
  console.log('Created .clasp.json from template. Replace YOUR_SCRIPT_ID, then run: npx clasp login && npm run push');
}
