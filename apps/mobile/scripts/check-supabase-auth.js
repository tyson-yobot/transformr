// Check and fix Supabase auth configuration via Playwright
const { chromium } = require('playwright');

(async () => {
  const userDataDir = 'C:/Users/tlerf/AppData/Local/BraveSoftware/Brave-Browser/User Data';
  const context = await chromium.launchPersistentContext(userDataDir, {
    executablePath: 'C:/Users/tlerf/AppData/Local/BraveSoftware/Brave-Browser/Application/brave.exe',
    headless: false,
    args: ['--profile-directory=Default', '--no-first-run', '--no-default-browser-check'],
    timeout: 60000,
  });

  const page = await context.newPage();

  console.log('Opening Supabase auth providers...');
  await page.goto('https://supabase.com/dashboard/project/horqwbfsqqmzdbbafvov/auth/providers', {
    waitUntil: 'domcontentloaded',
    timeout: 45000,
  });

  // Wait for React to render
  await page.waitForTimeout(5000);

  // Screenshot the providers page
  await page.screenshot({ path: 'C:/dev/transformr/apps/mobile/screenshots/supabase-providers.png', fullPage: true });
  console.log('Providers screenshot taken');

  // Check for email confirmation setting
  const pageContent = await page.content();
  const hasConfirmEmail = pageContent.includes('Confirm email') || pageContent.includes('email confirmation') || pageContent.includes('Email confirmations');
  console.log('Email confirmation section found:', hasConfirmEmail);
  console.log('Page title:', await page.title());

  // Navigate to URL configuration
  console.log('Opening redirect URLs config...');
  await page.goto('https://supabase.com/dashboard/project/horqwbfsqqmzdbbafvov/auth/url-configuration', {
    waitUntil: 'domcontentloaded',
    timeout: 45000,
  });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'C:/dev/transformr/apps/mobile/screenshots/supabase-redirect-urls.png', fullPage: true });
  console.log('Redirect URLs screenshot taken');

  const redirectContent = await page.content();
  console.log('Has transformr scheme:', redirectContent.includes('transformr://'));
  console.log('Has supabase callback:', redirectContent.includes('supabase.co/auth/v1/callback'));

  await context.close();
  console.log('Done');
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
