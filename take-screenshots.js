const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = '/Users/kunjpatel/.gemini/antigravity/brain/22ef6439-9826-4b36-9729-ee5b3d89c935';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const API_URL = 'http://localhost:5001';
const APP_URL = 'http://localhost:5173';

async function main() {
  console.log('🚀 Starting screenshot automation for new functionality...');

  // 1. Prepare user & task data via API
  const testEmail = `kunj_${Date.now()}@charusat.edu.in`;
  const testPassword = 'Password123!';

  console.log('1. Registering user and seeding tasks in database...');
  const regRes = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword })
  });
  const regData = await regRes.json();
  const token = regData.token;

  if (!token) {
    throw new Error('Failed to register test user: ' + JSON.stringify(regData));
  }

  // Seed sample tasks with varying priorities and completion states
  const sampleTasks = [
    { title: 'Implement React.lazy and Suspense code splitting', description: 'Practical 8 performance optimization for route components', priority: 'high', completed: true },
    { title: 'Configure in-memory caching with node-cache', description: 'Practical 9 server-side query optimization and cache invalidation', priority: 'high', completed: true },
    { title: 'Build asynchronous event pipeline with EventEmitter', description: 'Practical 10 background notification handling without blocking API response', priority: 'medium', completed: false },
    { title: 'Prepare documentation and viva analysis report', description: 'Documenting empirical response times and architecture diagrams', priority: 'low', completed: false }
  ];

  for (const t of sampleTasks) {
    await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(t)
    });
  }
  console.log('   Tasks seeded successfully!');

  // 2. Launch headless Chrome via puppeteer-core
  console.log('2. Launching Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1280, height: 950, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();

  // SCREENSHOT 1: Auth View (Projects Tab without token)
  console.log('3. Capturing Screenshot 1: Secure Authentication View...');
  await page.goto(`${APP_URL}/projects`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('.auth-container', { timeout: 10000 });
  const shot1 = path.join(ARTIFACT_DIR, 'screenshot_1_auth_view.png');
  await page.screenshot({ path: shot1, fullPage: false });
  console.log(`   Saved: ${shot1}`);

  // SCREENSHOT 2: Task Manager Dashboard (With Tasks & Profile Header)
  console.log('4. Capturing Screenshot 2: Database Task Manager Dashboard...');
  await page.evaluate((jwt) => {
    localStorage.setItem('jwt_token', jwt);
  }, token);
  await page.goto(`${APP_URL}/projects`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('.task-row-card', { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 800)); // Allow CSS animations to settle
  const shot2 = path.join(ARTIFACT_DIR, 'screenshot_2_task_manager.png');
  await page.screenshot({ path: shot2, fullPage: false });
  console.log(`   Saved: ${shot2}`);

  // SCREENSHOT 3: Practical 8 Feature - Lazy-Loaded Task Analytics Chart
  console.log('5. Capturing Screenshot 3: Lazy-Loaded Task Analytics Chart...');
  const toggleBtn = await page.waitForSelector('.analytics-toggle-btn');
  await toggleBtn.click();
  // Wait for the dynamically imported chunk TaskAnalyticsChart to load and render
  await page.waitForSelector('.analytics-card', { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 1000)); // Wait for circular gauge transition
  const shot3 = path.join(ARTIFACT_DIR, 'screenshot_3_lazy_analytics_chart.png');
  await page.screenshot({ path: shot3, fullPage: false });
  console.log(`   Saved: ${shot3}`);

  // SCREENSHOT 4: Practical 8 Feature - Suspense Loading Fallback Screen
  console.log('6. Capturing Screenshot 4: Suspense Loading Fallback...');
  await page.evaluate(() => {
    // Temporarily trigger the fallback state for capturing
    const root = document.querySelector('#root');
    const existing = root.innerHTML;
    root.innerHTML = `
      <nav class="navbar glass-nav">
        <div class="nav-content">
          <span class="logo">KP.</span>
        </div>
      </nav>
      <div class="lazy-loading-screen" role="status" aria-live="polite">
        <div class="lazy-fallback-card glass-panel">
          <div class="lazy-spinner-ring">
            <div class="lazy-spinner-inner"></div>
          </div>
          <h3 class="lazy-fallback-title">Loading page module...</h3>
          <p class="lazy-fallback-subtitle">
            Code-split chunk requested via <code>React.lazy()</code> &amp; <code>Suspense</code>
          </p>
          <div class="lazy-progress-bar">
            <div class="lazy-progress-indeterminate"></div>
          </div>
        </div>
      </div>
    `;
  });
  await new Promise((r) => setTimeout(r, 500));
  const shot4 = path.join(ARTIFACT_DIR, 'screenshot_4_suspense_loading_fallback.png');
  await page.screenshot({ path: shot4, fullPage: false });
  console.log(`   Saved: ${shot4}`);

  // SCREENSHOT 5: Practical 9 Feature - In-Memory Cache Telemetry Endpoint (/cache-stats)
  console.log('7. Capturing Screenshot 5: In-Memory Cache Telemetry...');
  // Make a couple of task fetches to populate hit/miss stats
  await fetch(`${API_URL}/tasks`, { headers: { 'Authorization': `Bearer ${token}` } });
  await fetch(`${API_URL}/tasks`, { headers: { 'Authorization': `Bearer ${token}` } });
  
  await page.goto(`${API_URL}/cache-stats`, { waitUntil: 'networkidle2' });
  const shot5 = path.join(ARTIFACT_DIR, 'screenshot_5_cache_telemetry.png');
  await page.screenshot({ path: shot5, fullPage: false });
  console.log(`   Saved: ${shot5}`);

  await browser.close();
  console.log('✨ All browser screenshots captured successfully!');
}

main().catch((err) => {
  console.error('Screenshot Capture Failed:', err);
  process.exit(1);
});
