import { readFileSync, writeFileSync } from 'fs';

const files = [
  "src/app/[lang]/docs/dashboard/page.mdx",
];

// Define all the object constants we need
const objectReplacements = [
  { pattern: /trend=\{\{ value: 12, direction: "up" \}\}/g, replacement: 'trend={trendUp12}' },
  { pattern: /trend=\{\{ value: 5, direction: "up" \}\}/g, replacement: 'trend={trendUp5}' },
  { pattern: /trend=\{\{ value: 2, direction: "down" \}\}/g, replacement: 'trend={trendDown2}' },
  { pattern: /trend=\{\{ value: 23, direction: "up" \}\}/g, replacement: 'trend={trendUp23}' },
  { pattern: /change=\{\{ value: 5, direction: "up" \}\}/g, replacement: 'change={changeUp5}' },
  { pattern: /columns=\{\{ base: 1, md: 2 \}\}/g, replacement: 'columns={gridCols1_2}' },
  { pattern: /columns=\{\{ base: 1, md: 2, lg: 3 \}\}/g, replacement: 'columns={gridCols1_2_3}' },
  { pattern: /columns=\{\{ base: 1, md: 2, lg: 4 \}\}/g, replacement: 'columns={gridCols1_2_4}' },
];

// Constants to export
const exports = `
export const trendUp12 = { value: 12, direction: "up" }
export const trendUp5 = { value: 5, direction: "up" }
export const trendDown2 = { value: 2, direction: "down" }
export const trendUp23 = { value: 23, direction: "up" }
export const changeUp5 = { value: 5, direction: "up" }
export const gridCols1_2 = { base: 1, md: 2 }
export const gridCols1_2_3 = { base: 1, md: 2, lg: 3 }
export const gridCols1_2_4 = { base: 1, md: 2, lg: 4 }
`;

files.forEach((file) => {
  let content = readFileSync(file, 'utf8');

  // Remove existing gridColumns export if present
  content = content.replace(/export const gridColumns = \{ base: 1, md: 2, lg: 4 \}\n\n/g, '');

  // Apply all replacements
  objectReplacements.forEach(({ pattern, replacement }) => {
    content = content.replace(pattern, replacement);
  });

  // Add exports after imports
  // Find the last import line
  const lastImportMatch = content.match(/^import .+$/gm);
  if (lastImportMatch) {
    const lastImport = lastImportMatch[lastImportMatch.length - 1];
    content = content.replace(lastImport, lastImport + '\n' + exports);
  }

  writeFileSync(file, content, 'utf8');
  console.log(`Fixed ${file}`);
});

console.log('All MDX files fixed!');
