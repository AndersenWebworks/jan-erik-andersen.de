#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Sizes to generate
const sizes = [16, 32, 48, 64, 128, 180, 192, 512];

console.log('Checking for sharp...');

// Try to require sharp
let sharp;
try {
  sharp = require('sharp');
} catch (err) {
  console.log('\nsharp not found. Installing...\n');
  const { execSync } = require('child_process');
  execSync('npm install sharp', { stdio: 'inherit' });
  sharp = require('sharp');
}

const svgPath = path.join(__dirname, 'favicon.svg');

async function generatePNG(size) {
  const outputPath = path.join(__dirname, `favicon-${size}x${size}.png`);

  console.log(`Generating favicon-${size}x${size}.png...`);

  try {
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`  ✓ Created favicon-${size}x${size}.png`);
    return true;
  } catch (err) {
    console.error(`  ✗ Error: ${err.message}`);
    return false;
  }
}

async function main() {
  if (!fs.existsSync(svgPath)) {
    console.error(`Error: ${svgPath} not found!`);
    process.exit(1);
  }

  console.log(`\nReading ${svgPath}...`);
  console.log(`Generating ${sizes.length} PNG files...\n`);

  for (const size of sizes) {
    await generatePNG(size);
  }

  console.log('\n✓ All favicons generated successfully!');
  console.log('\nGenerated files:');
  sizes.forEach(size => {
    console.log(`  - favicon-${size}x${size}.png`);
  });
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
