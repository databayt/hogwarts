import { writeFile, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Pages to scrape for icons
const PAGES_TO_SCRAPE = [
  'https://www.anthropic.com/news',
  'https://www.anthropic.com/research',
  'https://www.anthropic.com/company',
  'https://www.anthropic.com/claude',
  'https://www.anthropic.com/api',
  'https://www.anthropic.com/product',
  'https://claude.com/product/claude-code',
  'https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview',
];

async function fetchPageIcons(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`Failed to fetch ${url}: ${response.status}`);
      return [];
    }

    const html = await response.text();

    // Extract image URLs from multiple CDNs
    const cdnPatterns = [
      // Anthropic CDN
      /https:\/\/www-cdn\.anthropic\.com\/images\/[^"'\s]+\.(svg|png|jpg|jpeg|webp)/gi,
      // Webflow CDN (used on homepage)
      /https:\/\/cdn\.prod\.website-files\.com\/[^"'\s]+\.(svg|png|jpg|jpeg|webp)/gi,
      // Assets CDN
      /https:\/\/assets\.anthropic\.com\/[^"'\s]+\.(svg|png|jpg|jpeg|webp)/gi,
    ];

    const allMatches = [];
    for (const pattern of cdnPatterns) {
      const matches = html.match(pattern) || [];
      allMatches.push(...matches);
    }

    // Remove duplicates
    return [...new Set(allMatches)];
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return [];
  }
}

async function downloadIcon(url, outputPath) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Check if it's SVG (text) or binary (PNG, JPG, WEBP)
    const isSvg = url.toLowerCase().endsWith('.svg');

    if (isSvg) {
      const content = await response.text();
      await writeFile(outputPath, content, 'utf8');
    } else {
      const buffer = await response.arrayBuffer();
      await writeFile(outputPath, Buffer.from(buffer));
    }

    return { success: true, url, outputPath };
  } catch (error) {
    return { success: false, url, error: error.message };
  }
}

async function main() {
  console.log('=== Fetching Icon URLs from Anthropic pages ===\n');

  // Collect all icon URLs
  const allUrls = new Set();

  for (const page of PAGES_TO_SCRAPE) {
    console.log(`Scraping ${page}...`);
    const urls = await fetchPageIcons(page);
    urls.forEach(url => allUrls.add(url));
    console.log(`  Found ${urls.length} unique image URLs`);
  }

  console.log(`\n=== Total unique image URLs found: ${allUrls.size} ===\n`);

  // Read existing URLs
  const urlsFile = join(__dirname, 'public', 'icons', 'extracted-urls.txt');
  let existingContent = '';
  try {
    existingContent = await readFile(urlsFile, 'utf8');
  } catch (error) {
    console.log('No existing URLs file found, creating new one');
  }

  const existingUrls = new Set(
    existingContent
      .split('\n')
      .filter(line => line.trim().startsWith('https://'))
      .map(line => line.trim())
  );

  console.log(`Existing URLs in collection: ${existingUrls.size}`);

  // Find new URLs
  const newUrls = [...allUrls].filter(url => !existingUrls.has(url));

  console.log(`New URLs to download: ${newUrls.length}\n`);

  if (newUrls.length === 0) {
    console.log('No new icons to download. Collection is up to date!');
    return;
  }

  // Download new icons
  const outputDir = join(__dirname, 'public', 'icons');
  const results = [];

  for (let i = 0; i < newUrls.length; i++) {
    const url = newUrls[i];
    const filename = url.split('/').pop();
    const outputPath = join(outputDir, filename);

    console.log(`[${i + 1}/${newUrls.length}] Downloading ${filename}...`);
    const result = await downloadIcon(url, outputPath);
    results.push(result);

    if (result.success) {
      console.log(`  ✓ Saved`);
    } else {
      console.error(`  ✗ Failed: ${result.error}`);
    }
  }

  // Update extracted-urls.txt with all URLs
  const allUrlsSorted = [...existingUrls, ...newUrls.filter(url =>
    results.find(r => r.url === url && r.success)
  )].sort();

  const updatedContent = `# Extracted SVG and Image URLs from Anthropic websites
# Total: ${allUrlsSorted.length} unique URLs
# Last updated: ${new Date().toISOString().split('T')[0]}

${allUrlsSorted.join('\n')}
`;

  await writeFile(urlsFile, updatedContent, 'utf8');
  console.log(`\n✓ Updated ${urlsFile}`);

  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log('\n=== Download Summary ===');
  console.log(`New icons downloaded: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total icons in collection: ${allUrlsSorted.length}`);

  if (failed > 0) {
    console.log('\nFailed downloads:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.url}: ${r.error}`);
    });
  }
}

main().catch(console.error);
