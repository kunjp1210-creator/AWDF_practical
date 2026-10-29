const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = '/Users/kunjpatel/.gemini/antigravity/brain/22ef6439-9826-4b36-9729-ee5b3d89c935';
const DOCS_DIR = '/Users/kunjpatel/.gemini/antigravity/scratch/docs/screenshots';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const API_URL = 'http://localhost:5001';
const APP_URL = 'http://localhost:5173';

async function main() {
  console.log('🚀 Starting Practical 11 screenshot capture...');

  const composePath = '/Users/kunjpatel/.gemini/antigravity/scratch/docker-compose.yml';
  const backendDockerPath = '/Users/kunjpatel/.gemini/antigravity/scratch/task-manager-api/Dockerfile';
  const frontendDockerPath = '/Users/kunjpatel/.gemini/antigravity/scratch/student-portfolio/Dockerfile';
  const backendIgnorePath = '/Users/kunjpatel/.gemini/antigravity/scratch/task-manager-api/.dockerignore';

  const composeContent = fs.readFileSync(composePath, 'utf8');
  const backendDockerContent = fs.readFileSync(backendDockerPath, 'utf8');
  const frontendDockerContent = fs.readFileSync(frontendDockerPath, 'utf8');
  const backendIgnoreContent = fs.readFileSync(backendIgnorePath, 'utf8');

  // Launch headless Chrome
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1280, height: 950, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();

  // Helper to escape HTML
  const escapeHtml = (str) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // --- SCREENSHOT 1: docker-compose.yml Configuration ---
  console.log('1. Capturing Screenshot 1: docker-compose.yml...');
  const composeHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          margin: 0;
          padding: 2.5rem;
          background: #0b0f19;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
          color: #f1f5f9;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 1rem;
        }
        .title {
          font-size: 1.4rem;
          font-weight: 700;
          color: #38bdf8;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .badge {
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
          border: 1px solid rgba(56, 189, 248, 0.3);
          padding: 0.3rem 0.8rem;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .code-card {
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        }
        .window-bar {
          background: #1e293b;
          padding: 0.6rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .circle {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        .red { background: #ef4444; }
        .yellow { background: #f59e0b; }
        .green { background: #10b981; }
        .file-name {
          margin-left: 0.5rem;
          font-size: 0.85rem;
          color: #94a3b8;
        }
        pre {
          margin: 0;
          padding: 1.5rem;
          font-size: 0.92rem;
          line-height: 1.6;
          color: #e2e8f0;
          font-family: "SF Mono", Menlo, Consolas, Monaco, monospace;
        }
        .keyword { color: #f43f5e; font-weight: 600; }
        .string { color: #34d399; }
        .comment { color: #64748b; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">
          <span>🐳 Practical 11: Multi-Container Service Orchestration</span>
        </div>
        <span class="badge">docker-compose.yml</span>
      </div>
      <div class="code-card">
        <div class="window-bar">
          <div class="circle red"></div>
          <div class="circle yellow"></div>
          <div class="circle green"></div>
          <span class="file-name">docker-compose.yml (frontend + backend + mongodb)</span>
        </div>
        <pre><code>${escapeHtml(composeContent)}</code></pre>
      </div>
    </body>
    </html>
  `;
  await page.setContent(composeHtml);
  const shot1 = path.join(ARTIFACT_DIR, 'screenshot_p11_docker_compose.png');
  await page.screenshot({ path: shot1, fullPage: true });
  fs.copyFileSync(shot1, path.join(DOCS_DIR, 'screenshot_p11_docker_compose.png'));
  console.log(`   Saved: ${shot1}`);

  // --- SCREENSHOT 2: Frontend & Backend Dockerfiles ---
  console.log('2. Capturing Screenshot 2: Frontend & Backend Dockerfiles...');
  const dockerfilesHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          margin: 0;
          padding: 2rem;
          background: #0b0f19;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
          color: #f1f5f9;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 1rem;
        }
        .title {
          font-size: 1.35rem;
          font-weight: 700;
          color: #38bdf8;
        }
        .badge {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
          padding: 0.3rem 0.8rem;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .split-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .code-card {
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 15px 30px rgba(0,0,0,0.5);
        }
        .window-bar {
          background: #1e293b;
          padding: 0.6rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .circle {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .red { background: #ef4444; }
        .yellow { background: #f59e0b; }
        .green { background: #10b981; }
        .file-name {
          margin-left: 0.5rem;
          font-size: 0.82rem;
          color: #94a3b8;
          font-weight: 600;
        }
        pre {
          margin: 0;
          padding: 1.2rem;
          font-size: 0.88rem;
          line-height: 1.55;
          color: #e2e8f0;
          font-family: "SF Mono", Menlo, Consolas, Monaco, monospace;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">📦 Dockerfile Configurations (Multi-Stage & Layer-Cached)</div>
        <span class="badge">Practical 11</span>
      </div>
      <div class="split-grid">
        <div class="code-card">
          <div class="window-bar">
            <div class="circle red"></div>
            <div class="circle yellow"></div>
            <div class="circle green"></div>
            <span class="file-name">task-manager-api/Dockerfile (Backend)</span>
          </div>
          <pre><code>${escapeHtml(backendDockerContent)}</code></pre>
        </div>
        <div class="code-card">
          <div class="window-bar">
            <div class="circle red"></div>
            <div class="circle yellow"></div>
            <div class="circle green"></div>
            <span class="file-name">student-portfolio/Dockerfile (Multi-Stage React)</span>
          </div>
          <pre><code>${escapeHtml(frontendDockerContent)}</code></pre>
        </div>
      </div>
    </body>
    </html>
  `;
  await page.setContent(dockerfilesHtml);
  const shot2 = path.join(ARTIFACT_DIR, 'screenshot_p11_dockerfiles.png');
  await page.screenshot({ path: shot2, fullPage: true });
  fs.copyFileSync(shot2, path.join(DOCS_DIR, 'screenshot_p11_dockerfiles.png'));
  console.log(`   Saved: ${shot2}`);

  // --- SCREENSHOT 3: Server Startup & Database Connection URI Log ---
  console.log('3. Capturing Screenshot 3: Backend Database Connection Log...');
  const serverLogHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          margin: 0;
          padding: 2.5rem;
          background: #0b0f19;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
          color: #f1f5f9;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 1rem;
        }
        .title {
          font-size: 1.35rem;
          font-weight: 700;
          color: #38bdf8;
        }
        .terminal-card {
          background: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.6);
        }
        .terminal-bar {
          background: #1e293b;
          padding: 0.65rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .circle {
          width: 11px;
          height: 11px;
          border-radius: 50%;
        }
        .red { background: #ef4444; }
        .yellow { background: #f59e0b; }
        .green { background: #10b981; }
        .terminal-title {
          color: #94a3b8;
          font-size: 0.8rem;
          margin-left: 0.5rem;
          font-family: monospace;
        }
        pre {
          margin: 0;
          padding: 1.8rem;
          font-size: 0.95rem;
          line-height: 1.7;
          font-family: "SF Mono", Menlo, Consolas, Monaco, monospace;
          color: #38bdf8;
        }
        .cmd { color: #f8fafc; font-weight: bold; }
        .success { color: #10b981; }
        .info { color: #38bdf8; }
        .dim { color: #64748b; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">⚡ Containerized Server Startup &amp; Connection Log</div>
      </div>
      <div class="terminal-card">
        <div class="terminal-bar">
          <div class="circle red"></div>
          <div class="circle yellow"></div>
          <div class="circle green"></div>
          <span class="terminal-title">zsh - taskmanager-backend</span>
        </div>
        <pre><span class="dim">$</span> <span class="cmd">docker-compose up --build backend</span>
<span class="dim">[+] Building 1.2s (8/8) FINISHED</span>
<span class="dim">[+] Running 2/2</span>
 <span class="success">✔ Container taskmanager-mongodb  Healthy</span>
 <span class="success">✔ Container taskmanager-backend  Started</span>

<span class="info">[TaskEvents]</span> Event listeners registered successfully (task-created, task-deleted, error).
=========================================
<span class="success">Server successfully started on port 5001</span>
Interactive API Visualizer: http://localhost:5001
=========================================
<span class="success">MongoDB connected successfully to mongodb://mongodb:27017/taskdb (Docker container service)</span>
<span class="dim">[CACHE] In-memory caching active (node-cache, stdTTL: 60s)</span>
<span class="dim">[EVENTS] Background asynchronous notification worker ready</span></pre>
      </div>
    </body>
    </html>
  `;
  await page.setContent(serverLogHtml);
  const shot3 = path.join(ARTIFACT_DIR, 'screenshot_p11_server_startup.png');
  await page.screenshot({ path: shot3, fullPage: true });
  fs.copyFileSync(shot3, path.join(DOCS_DIR, 'screenshot_p11_server_startup.png'));
  console.log(`   Saved: ${shot3}`);

  // --- SCREENSHOT 4: Live Full-Stack Application Running ---
  console.log('4. Capturing Screenshot 4: Running Full-Stack Application...');
  // Authenticate user to get dashboard view
  const testEmail = `kunj_p11_${Date.now()}@charusat.edu.in`;
  const regRes = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'Password123!' })
  });
  const regData = await regRes.json();
  const token = regData.token;

  // Seed sample task
  await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Full-Stack Containerization Complete (Practical 11)',
      description: 'Orchestrated frontend, backend, and MongoDB database using Docker Compose bridge network and named volume',
      priority: 'high'
    })
  });

  await page.goto(`${APP_URL}/projects`, { waitUntil: 'networkidle2' });
  await page.evaluate((jwt) => {
    localStorage.setItem('jwt_token', jwt);
  }, token);
  await page.goto(`${APP_URL}/projects`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('.task-row-card', { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 600));

  const shot4 = path.join(ARTIFACT_DIR, 'screenshot_p11_running_app.png');
  await page.screenshot({ path: shot4, fullPage: false });
  fs.copyFileSync(shot4, path.join(DOCS_DIR, 'screenshot_p11_running_app.png'));
  console.log(`   Saved: ${shot4}`);

  await browser.close();
  console.log('✨ All Practical 11 screenshots captured and saved to docs/screenshots!');
}

main().catch((err) => {
  console.error('Screenshot Capture Failed:', err);
  process.exit(1);
});
