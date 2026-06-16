const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setViewportSize({ width: 1440, height: 900 });

  // Login page
  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'C:/Users/Kabir/Documents/maladie/screenshot_login.png', fullPage: true });
  console.log('LOGIN done');

  // Login
  await page.fill('input[type="email"], input[name="email"]', 'medecin@demo.com');
  await page.fill('input[type="password"], input[name="password"]', 'demo123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'C:/Users/Kabir/Documents/maladie/screenshot_dashboard.png', fullPage: true });
  console.log('DASHBOARD done', page.url());

  // Patients
  await page.goto('http://localhost:5173/patients');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'C:/Users/Kabir/Documents/maladie/screenshot_patients.png', fullPage: true });
  console.log('PATIENTS done');

  // Consultation
  await page.goto('http://localhost:5173/consultation');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'C:/Users/Kabir/Documents/maladie/screenshot_consultation.png', fullPage: true });
  console.log('CONSULTATION done');

  // Diagnostics
  await page.goto('http://localhost:5173/diagnostics');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'C:/Users/Kabir/Documents/maladie/screenshot_diagnostics.png', fullPage: true });
  console.log('DIAGNOSTICS done');

  // Statistics
  await page.goto('http://localhost:5173/statistics');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'C:/Users/Kabir/Documents/maladie/screenshot_statistics.png', fullPage: true });
  console.log('STATISTICS done');

  await browser.close();
})();
