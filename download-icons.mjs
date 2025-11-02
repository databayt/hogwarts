import { writeFile, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function downloadIcon(url, outputPath) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const svgContent = await response.text();
    await writeFile(outputPath, svgContent, 'utf8');
    return { success: true, url, outputPath };
  } catch (error) {
    return { success: false, url, error: error.message };
  }
}

async function main() {
  // Read the URLs file
  const urlsFile = join(__dirname, 'public', 'icons', 'extracted-urls.txt');
  const content = await readFile(urlsFile, 'utf8');

  // Extract URLs (skip comment lines)
  const urls = content
    .split('\n')
    .filter(line => line.trim().startsWith('https://'))
    .map(line => line.trim());

  console.log(`Found ${urls.length} URLs to download`);

  const outputDir = join(__dirname, 'public', 'icons');
  const results = [];

  // Download all SVGs
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    // Extract filename from URL (e.g., "036c01a9e427ea0f4d1e6c7221e4f6dce2259bf7-1000x1000.svg")
    const filename = url.split('/').pop();
    const outputPath = join(outputDir, filename);

    console.log(`[${i + 1}/${urls.length}] Downloading ${filename}...`);
    const result = await downloadIcon(url, outputPath);
    results.push(result);

    if (result.success) {
      console.log(`  ✓ Saved to ${filename}`);
    } else {
      console.error(`  ✗ Failed: ${result.error}`);
    }
  }

  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log('\n=== Download Summary ===');
  console.log(`Total: ${urls.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed downloads:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.url}: ${r.error}`);
    });
  }
}

main().catch(console.error);
