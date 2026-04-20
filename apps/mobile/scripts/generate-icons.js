/**
 * Generate app icon variants at all required sizes.
 *
 * Source: TRANSFORMR_Logo_Background.png (735x853, dark background)
 * Also uses: icon.png (1024x1024, white/transparent background)
 *
 * Outputs organized icon files in assets/icons/
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ASSETS = path.resolve(__dirname, '..', 'assets');
const ICONS_DIR = path.join(ASSETS, 'icons');
const IMAGES_DIR = path.join(ASSETS, 'images');

const DARK_BG = '#0C0A15';
const WHITE_BG = '#FFFFFF';

// Sizes needed for iOS + Android + Web + Store listings
const SIZES = [1024, 512, 192, 144, 96, 72, 48];

async function generateIcons() {
  // Create subdirectories
  const darkDir = path.join(ICONS_DIR, 'dark');
  const lightDir = path.join(ICONS_DIR, 'light');
  fs.mkdirSync(darkDir, { recursive: true });
  fs.mkdirSync(lightDir, { recursive: true });

  // --- DARK BACKGROUND VARIANT ---
  // Source is 735x853 (not square). Trim artifact line at top, then
  // composite onto square dark canvas centered.
  const darkSource = path.join(ICONS_DIR, 'TRANSFORMR_Logo_Background.png');

  // Flatten the RGBA source onto the dark background first to avoid
  // alpha-edge artifacts, then extract the content area.
  const darkMeta = await sharp(darkSource).metadata();
  const flattenedDark = await sharp({
    create: {
      width: darkMeta.width,
      height: darkMeta.height,
      channels: 4,
      background: DARK_BG,
    },
  })
    .composite([{ input: darkSource, gravity: 'northwest' }])
    .removeAlpha()
    .png()
    .toBuffer();

  // Content bounds: top=111 bottom=730 left=28 right=707
  // Rows 111-114 are a decorative magenta line — skip them (start at 115)
  const contentLeft = 28;
  const contentTop = 115;
  const contentWidth = 680;
  const contentHeight = 730 - contentTop + 1; // 616px
  const maxDim = Math.max(contentWidth, contentHeight);
  // Add padding so the logo doesn't touch edges (15% on each side)
  const canvasSize = Math.ceil(maxDim * 1.3);

  // Extract the content portion from the flattened image, then place centered on square canvas
  const contentRegion = await sharp(flattenedDark)
    .extract({ left: contentLeft, top: contentTop, width: contentWidth, height: contentHeight })
    .png()
    .toBuffer();

  const darkMaster = await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 3,
      background: DARK_BG,
    },
  })
    .composite([{ input: contentRegion, gravity: 'centre' }])
    .resize(1024, 1024, { fit: 'cover' })
    .png()
    .toBuffer();

  // Generate all dark sizes
  for (const size of SIZES) {
    const filename = `icon-dark-${size}x${size}.png`;
    await sharp(darkMaster)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(path.join(darkDir, filename));
    console.log(`  Created: icons/dark/${filename}`);
  }

  // --- LIGHT/WHITE BACKGROUND VARIANT ---
  // Flatten source onto white, extract content, place on square white canvas
  const flattenedLight = await sharp({
    create: {
      width: darkMeta.width,
      height: darkMeta.height,
      channels: 4,
      background: WHITE_BG,
    },
  })
    .composite([{ input: darkSource, gravity: 'northwest' }])
    .removeAlpha()
    .png()
    .toBuffer();

  const lightContent = await sharp(flattenedLight)
    .extract({ left: contentLeft, top: contentTop, width: contentWidth, height: contentHeight })
    .png()
    .toBuffer();

  const lightMaster = await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 3,
      background: WHITE_BG,
    },
  })
    .composite([{ input: lightContent, gravity: 'centre' }])
    .resize(1024, 1024, { fit: 'cover' })
    .png()
    .toBuffer();

  for (const size of SIZES) {
    const filename = `icon-light-${size}x${size}.png`;
    await sharp(lightMaster)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(path.join(lightDir, filename));
    console.log(`  Created: icons/light/${filename}`);
  }

  // --- UPDATE THE APP ICON FILES (referenced by app.json) ---
  // Replace images/icon.png with dark background version (1024x1024)
  await sharp(darkMaster).toFile(path.join(IMAGES_DIR, 'icon.png'));
  console.log('\n  Updated: images/icon.png -> dark background (1024x1024)');

  // Replace images/adaptive-icon.png with dark background version (1024x1024)
  await sharp(darkMaster).toFile(path.join(IMAGES_DIR, 'adaptive-icon.png'));
  console.log('  Updated: images/adaptive-icon.png -> dark background (1024x1024)');

  // Replace images/splash.png with dark background version (1024x1024)
  await sharp(darkMaster).toFile(path.join(IMAGES_DIR, 'splash.png'));
  console.log('  Updated: images/splash.png -> dark background (1024x1024)');

  // Replace images/favicon.png with dark background version (48x48)
  await sharp(darkMaster)
    .resize(48, 48, { fit: 'cover' })
    .png()
    .toFile(path.join(IMAGES_DIR, 'favicon.png'));
  console.log('  Updated: images/favicon.png -> dark background (48x48)');

  // --- MOVE transformr-icon.png from images/ to icons/ ---
  const srcTransformrIcon = path.join(IMAGES_DIR, 'transformr-icon.png');
  const dstTransformrIcon = path.join(ICONS_DIR, 'transformr-icon.png');
  if (fs.existsSync(srcTransformrIcon)) {
    fs.copyFileSync(srcTransformrIcon, dstTransformrIcon);
    fs.unlinkSync(srcTransformrIcon);
    console.log('\n  Moved: images/transformr-icon.png -> icons/transformr-icon.png');
  }

  console.log('\nDone! Icon generation complete.');
  console.log('\nIcon directory structure:');
  console.log('  icons/');
  console.log('    TRANSFORMR_Logo_Background.png  (original source)');
  console.log('    transformr-icon.png             (moved from images/)');
  console.log('    transformr-favicon-.png          (existing)');
  console.log('    dark/                           (dark background variants)');
  SIZES.forEach(s => console.log(`      icon-dark-${s}x${s}.png`));
  console.log('    light/                          (white background variants)');
  SIZES.forEach(s => console.log(`      icon-light-${s}x${s}.png`));
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
