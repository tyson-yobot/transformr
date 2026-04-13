const sharp = require('sharp');
const path = require('path');

async function main() {
  const icon = path.join(__dirname, '..', 'assets', 'icons', 'source', 'transformr-icon-transparent-512x512.png');
  const output = path.join(__dirname, '..', 'apps', 'mobile', 'assets', 'images', 'splash.png');

  const bg = Buffer.from('<svg width="1284" height="2778"><rect width="1284" height="2778" fill="#0C0A15"/></svg>');

  await sharp(bg)
    .composite([{
      input: await sharp(icon).resize(360, 360).toBuffer(),
      gravity: 'centre',
    }])
    .png()
    .toFile(output);

  console.log('Splash generated:', output);
}
main().catch(console.error);
