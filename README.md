# Advanced Web Development Frameworks (AWDF) - Full-Stack Practicals

[![CI Pipeline](https://github.com/kunjp1210-creator/AWDF_practical/actions/workflows/ci.yml/badge.svg)](https://github.com/kunjp1210-creator/AWDF_practical/actions/workflows/ci.yml)

This repository contains the complete practical assignments for **Advanced Web Development Frameworks (ITUE301)** completed by **Kunj Patel**. It is structured as a full-stack monorepo separating the frontend React app and the backend Express/MongoDB REST API.

## Monorepo Directory Structure

- **[`student-portfolio/`](./student-portfolio)**: Frontend Single Page Application (SPA) built using Vite + React 18 + React Router v6. (Includes theme switcher, search routing, JWT auth, the integrated Database Task Manager UI, and **Practical 8 route-based lazy loading / code splitting**).
- **[`task-manager-api/`](./task-manager-api)**: Backend REST API server built using Node.js + Express.js + Mongoose (MongoDB). (Includes task models, custom validation formatting, and automated fallback database).

---

## Practical 8: Performance Optimization and Lazy Loading in React

### 1. Architecture: Single Bundle vs Code-Split Chunks

```text
Before Optimization (Monolithic Bundle):
 main.bundle.js ──────────────────────► [Home][Projects][Contact][NotFound] all downloaded upfront

After Optimization (Route-Based Code Splitting):
 index-DcDpyH5G.js (main shell) ─────► loads on first visit (~234 kB)
 Home-Xr7FPWqh.js (chunk) ───────────► loaded ONLY when '/' is visited (~3.5 kB)
 Projects-Bcv_h_Lq.js (chunk) ───────► loaded ONLY when '/projects' is visited (~12.3 kB)
 Contact-nXCVrhcn.js (chunk) ────────► loaded ONLY when '/contact' is visited (~4.2 kB)
 TaskAnalyticsChart-B6sMkg3l.js ─────► loaded ONLY on-demand when analytics button is clicked (~3.9 kB)
 NotFound-MERV7-RT.js (chunk) ───────► loaded ONLY on 404 route (~1.0 kB)
```

### 2. Measured Bundle Size Comparison

| Chunk / Asset | Before Optimization | After Optimization | Delta / Impact | Loading Trigger |
| :--- | :--- | :--- | :--- | :--- |
| **Initial JS Entry Shell** | `index-DKaLg3TI.js`: **252.51 kB** (gzip: 79.72 kB) | `index-DcDpyH5G.js`: **234.18 kB** (gzip: 75.17 kB) | **-18.33 kB (-4.55 kB gzip)** | First page load |
| **Projects Route Chunk** | Included in main bundle | `Projects-Bcv_h_Lq.js`: **12.33 kB** (gzip: 3.95 kB) | Code-split | Visit `/projects` |
| **Contact Route Chunk** | Included in main bundle | `Contact-nXCVrhcn.js`: **4.15 kB** (gzip: 1.59 kB) | Code-split | Visit `/contact` |
| **Home Route Chunk** | Included in main bundle | `Home-Xr7FPWqh.js`: **3.46 kB** (gzip: 1.29 kB) | Code-split | Visit `/` |
| **Task Analytics Chart** | Included in main bundle | `TaskAnalyticsChart-B6sMkg3l.js`: **3.86 kB** (gzip: 1.06 kB) | On-demand component split | Click "View Task Analytics" |
| **NotFound Route Chunk** | Included in main bundle | `NotFound-MERV7-RT.js`: **0.99 kB** (gzip: 0.55 kB) | Code-split | Visit unmatched route |
| **CSS Bundle** | `16.51 kB` (gzip: 3.63 kB) | `20.95 kB` (gzip: 4.41 kB) | +Fallback styling | Initial page load |

### 3. Key Concepts & Analysis (Viva & Evaluation)

1. **Difference between initial bundle and lazy-loaded chunk**:
   The initial bundle contains only the essential runtime, libraries, common layout (navigation, footer), and router logic necessary to render the initial entry shell. Lazy-loaded chunks contain page-specific code (e.g., the Task CRUD manager and forms) that the browser fetches over HTTP only when the user navigates to that route.
2. **Why lazy loading improves perceived performance**:
   Even though the total JavaScript downloaded across a full session remains comparable, the user experiences a much faster **First Contentful Paint (FCP)** and **Time to Interactive (TTI)** on initial load because the browser has to download, parse, and execute significantly less JavaScript before rendering the screen.
3. **When is lazy loading not worth the complexity**:
   For very small micro-applications (e.g., single-page utilities under 50 kB total JS), the overhead of creating extra HTTP requests, managing fallback loading states, and network round-trips can outweigh the negligible bundle reduction.
4. **Minimum Delay Fallback (Supplementary Problem 2)**:
   Implemented `lazyWithDelay` with a default 300ms minimum threshold. On fast connections, this prevents a jarring 10ms micro-flicker of the loading screen.
5. **React DevTools Profiler (Supplementary Problem 3)**:
   Individual task cards were memoized using `React.memo` and `useCallback` for event handlers (`handleToggleComplete`, `handleDeleteTrigger`). In Profiler recording, typing in the "Task title" input or toggling the theme does not re-render existing task list rows.

---

## Practical 9: In-Memory Caching and Query Optimization

### 1. Caching & Invalidation Architecture

```text
GET /tasks request
 │
 ▼
 Cache check (node-cache)
 ├── HIT  ──► Return cached JSON immediately from RAM [Header: X-Cache: HIT] (~0.78 ms)
 └── MISS ──► Query MongoDB ──► Store in cache (TTL: 60s) ──► Return JSON [Header: X-Cache: MISS] (~1.93 ms)

POST / PUT / DELETE /tasks
 │
 ▼
 Write to MongoDB ──► Invalidate cache key (tasks_${userId}, task_${userId}_${id})
```

### 2. Measured Response Time Comparison (Empirical Benchmark)

Measured across 3 repeated runs on identical query sets using `benchmark-cache.js`:

| Sample # | Uncached (MongoDB Query) | Cached (node-cache RAM) | Cache Status Header | Response Time Delta |
| :--- | :--- | :--- | :--- | :--- |
| **Sample 1** | **2.16 ms** | **0.75 ms** | `X-Cache: MISS` vs `HIT` | **2.88x faster** |
| **Sample 2** | **1.83 ms** | **0.64 ms** | `X-Cache: MISS` vs `HIT` | **2.86x faster** |
| **Sample 3** | **1.79 ms** | **0.95 ms** | `X-Cache: MISS` vs `HIT` | **1.88x faster** |
| **Average** | **1.93 ms** | **0.78 ms** | - | **2.5x FASTER overall** |

> In production network environments with disk I/O and remote database clusters, in-memory caching typically yields a **10x to 50x** reduction in API latency.

### 3. Key Viva / Analysis Questions Answered

1. **Why must the cache be invalidated on every write operation, and what would happen to data correctness if it were not?**
   If the cache is not invalidated upon write operations (`POST`, `PUT`, `DELETE`), subsequent `GET` requests will serve outdated snapshot data stored in RAM until the 60-second TTL expires. The user would create, edit, or delete a task but still see stale data upon refreshing, completely violating read-your-writes data correctness.
2. **What is a reasonable TTL in a task management context, and what trade-off does TTL length represent?**
   A TTL of **30 to 60 seconds** is ideal. Because write invalidation proactively guarantees data freshness on user mutations, TTL serves as a safety fallback. The trade-off is **Data Freshness vs. Database Load**: shorter TTL guarantees fast convergence with out-of-band updates at the cost of more frequent database queries; longer TTL offloads database CPU and IOPS at the risk of serving stale data if external database mutations occur.
3. **Why is in-memory caching (`node-cache`) not suitable for a multi-server/multi-instance deployment?**
   `node-cache` stores items inside the process heap of a single Node.js runtime. If the application is scaled horizontally behind a round-robin load balancer (Instances A, B, and C):
   - A user writes a task to Instance A (which invalidates Instance A's local cache).
   - The user's next request routes to Instance B, which still retains the stale cached response in its memory.
   For multi-instance deployments, a **distributed cache** such as **Redis** or **Memcached** is required so all instances read and invalidate against a single shared cache layer.

### 4. Supplementary Features Implemented

- **Separate Single-Task Caching (`GET /tasks/:id`)**: Cached under key `task_${userId}_${id}` with `X-Cache: HIT/MISS` headers.
- **Cache Telemetry Debug Endpoint (`GET /cache-stats`)**: Exposes real-time hit counts, miss counts, hit ratio percentage, active keys, and standard TTL configuration.
- **Cache Invalidation Verification**: Mutation creates new task and verifies subsequent fetch is a cache miss returning the fresh document list.

---

## Practical 10: Asynchronous Processing with Event-Driven Architecture

### 1. Architecture: Synchronous Response vs. Asynchronous Event Pipeline

```text
POST /tasks request
 │
 ▼
 Save task to MongoDB
 │
 ▼
 API responds immediately (201 Created) ──► Client receives JSON (~6.89 ms HTTP round-trip)
 │
 ▼ (handled asynchronously, after response sent)
 taskEvents.emit('task-created', taskData)
 │
 ▼
 Notification Listener (listeners.js)
 └── logs: task title, timestamp, assigned user (+2000ms simulated async email delivery)
```

### 2. Empirical Console Log Evidence (Timestamp Ordering Proof)

Execution log captured from server console during `node test-events.js`:

```text
[API] ⚡ Response sent (201 Created) at 2026-10-24T02:58:13.210Z for task: "Async Notification Demo Task"
[Notification Worker] 🔔 Background task-created event received at 2026-10-24T02:58:13.211Z
   Task Title : "Async Notification Demo Task"
   Assigned To: event_user_1792810693057@example.com
   Priority   : high

[REQUEST] DELETE /tasks/6adc1ec5f2cbd8636b4dcd2e - 2026-10-24T02:58:13.213Z
[API] ⚡ Response sent (200 OK) at 2026-10-24T02:58:13.236Z for deleted task ID: 6adc1ec5f2cbd8636b4dcd2e
[Audit Worker] 🗑️ Task deleted notification received at 2026-10-24T02:58:13.236Z

[Notification Worker] ✅ Email notification sent for "Async Notification Demo Task"
   Dispatched: 2026-10-24T02:58:13.211Z
   Completed : 2026-10-24T02:58:15.212Z (+2000ms after API responded)
```

> **Proof of Non-Blocking Execution**: The client received HTTP 201 Created at `...13.210Z` (taking only 6.89ms), while the background email delivery finished 2002ms later at `...15.212Z` without stalling subsequent requests (`DELETE /tasks/...` ran in between!).

### 3. Key Viva / Analysis Questions Answered

1. **Why does emitting an event not block the API response, even though both run on the same Node.js process?**
   Node.js operates on a single-threaded event loop with non-blocking I/O. When `taskEvents.emit()` is called after `res.status(201).json()`, the HTTP response is dispatched immediately. When the listener schedules asynchronous work via `setTimeout`, promises, or network I/O, the callback is offloaded to the event loop's timer queue. The main thread continues processing incoming requests without waiting for the background job to finish.
2. **What would happen to API response time if the notification logic were placed directly inside the POST route?**
   If placed synchronously inside the route handler (e.g. `await sendEmail()`), the HTTP response would be blocked until the email completed. API response time would surge from **~7ms to over 2007ms**, severely degrading user experience and tying up Express worker threads.
3. **Why is EventEmitter a reasonable choice for this scale of application, but not for a production system handling millions of events per day?**
   `EventEmitter` is an in-memory, process-local publish-subscribe utility requiring zero infrastructure setup. However, it does not persist events (server restarts discard pending events), cannot cross process/server boundaries across clusters, lacks rate-limiting/concurrency controls, and provides no dead-letter queue or retry guarantees. Large production systems require dedicated distributed message brokers like **RabbitMQ**, **Apache Kafka**, or **Redis Streams**.

### 4. Supplementary Problems Implemented

- **`task-deleted` Event**: Registered dedicated audit listener that logs task ID and deletion timestamps.
- **`error` Event Listener**: Implemented error boundary listener (`taskEvents.on('error', ...)`) to prevent unhandled error events from crashing the Node.js process.
- **Simulated Slow Worker**: 2-second background delivery demonstrates decoupling of long-running side effects.

---

## Practical 11: Containerization with Docker and Docker Compose

### 1. Architecture: Multi-Container Orchestration

```text
docker-compose.yml
 ├── frontend (React + Vite Preview, port 5173)
 ├── backend  (Node.js / Express REST API, port 5001)
 └── mongodb  (Official mongo:6.0 image, port 27017, volume: mongo-data)

Network: app-network (bridge)
 frontend ──► backend ──► mongodb
 All 3 services start together via: docker-compose up --build
```

### 2. Single-Command Full-Stack Execution

Start all 3 services (database, backend API, and frontend client) simultaneously:

```bash
docker-compose up --build
```

To stop all services and preserve database data:
```bash
docker-compose down
```

To check running container statuses:
```bash
docker ps
```

### 3. Key Viva / Analysis Questions Answered

1. **Why does the backend container need to reference the MongoDB container by its service name (`mongodb`) rather than `localhost`?**
   In Docker, each container operates in its own isolated network namespace with its own `localhost` (127.0.0.1) loopback interface. Inside the backend container, `localhost` refers only to itself, not to other containers or the host. When containers share a custom bridge network (`app-network`), Docker provides built-in DNS resolution mapping each service name (`mongodb`, `backend`, `frontend`) to its respective dynamic container IP.
2. **What is the difference between `EXPOSE` in a Dockerfile and the `ports` mapping in `docker-compose.yml`?**
   `EXPOSE` serves as documentation and metadata indicating which port the containerized process listens on internally; it does **not** make ports accessible from the host system. The `ports` directive in `docker-compose.yml` (`HOST:CONTAINER`, e.g., `"5001:5001"`) establishes an active network NAT rule binding the container port to the host machine so web browsers and tools on the host can access it.
3. **Why is it considered bad practice to copy `node_modules` into a Docker image instead of running `npm install` inside?**
   - **Binary Compatibility**: Native C++ node addons (e.g. `bcrypt`, native bindings) compiled on the host OS (such as macOS Darwin) will fail with binary execution errors inside Linux containers.
   - **Build Context Bloat**: Copying heavy `node_modules` drastically inflates Docker build context transfer time and invalidates layer caching. Running `npm install` inside the container builds clean Linux-compatible binaries.

### 4. Supplementary Problems Implemented

- **`.dockerignore` Optimization**: Excludes `node_modules`, `.env`, and git history to maintain lean build contexts and prevent credential leaks.
- **Multi-Stage Frontend Build**: Uses a two-stage build (`node:18-alpine AS build` & `AS serve`) to minimize final container image footprints.
- **Named Volume Persistence**: Mounts `mongo-data:/data/db` so MongoDB data persists across container teardowns and restarts.

---

## Practical 12: CI/CD Pipeline with GitHub Actions

### 1. CI Pipeline Architecture

```text
git push origin main / pull request
 │
 ▼
 GitHub Actions Trigger (on: push, pull_request)
 │
 ├── Job 1: lint (Syntax & Code Integrity Check)
 │     ├── Checkout repository (actions/checkout@v4)
 │     ├── Setup Node.js 18 (actions/setup-node@v4)
 │     ├── npm ci (task-manager-api)
 │     └── node --check syntax verification (server, cache, events, listeners)
 │
 └── Job 2: build-and-test (needs: lint)
       ├── Checkout repository (actions/checkout@v4)
       ├── Setup Node.js 18 (actions/setup-node@v4)
       ├── npm ci (task-manager-api)
       ├── Automated API Test Suite (Jest + Supertest)
       │     ├── [PASS] GET /tasks returns 401 without JWT token
       │     ├── [PASS] POST /register returns valid JWT auth token
       │     ├── [PASS] POST /tasks creates database document for authenticated user
       │     ├── [PASS] GET /tasks returns 200 with tasks array
       │     └── [PASS] GET /cache-stats returns 200 with cache telemetry
       ├── npm ci (student-portfolio)
       └── npm run build (Vite production asset compilation)
       │
       ▼
 Green Checkmark (PASS) or Red X (FAIL) on GitHub
```

### 2. Local Test Execution Output

```text
PASS tests/api.test.js
  Task Management API Test Suite (CI/CD Pipeline)
    ✓ GET /tasks returns 401 Unauthorized when missing JWT token (27 ms)
    ✓ POST /register successfully creates account and returns JWT token (122 ms)
    ✓ POST /tasks creates a new task document for authenticated user (10 ms)
    ✓ GET /tasks returns 200 OK with list of tasks for authenticated user (20 ms)
    ✓ GET /cache-stats returns 200 OK with cache telemetry data (4 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        0.758 s
```

### 3. Key Viva / Analysis Questions Answered

1. **What is the difference between Continuous Integration and Continuous Deployment, and which one does this practical actually demonstrate?**
   - **Continuous Integration (CI)**: The automated practice of validating code changes by building, linting, and running automated test suites upon every commit or pull request.
   - **Continuous Deployment (CD)**: Automatically deploying every code change that passes the CI pipeline directly into staging or production servers without human intervention.
   - This practical specifically implements and demonstrates **Continuous Integration (CI)** by validating code syntax, executing Jest tests against the backend API, and testing the frontend production build.
2. **Why does running tests automatically on every push catch problems earlier than testing manually before a release?**
   Automated testing on every push establishes an immediate feedback loop. Instead of discovering breaking changes days or weeks later during pre-release testing (where pinpointing the regression across hundreds of modified files is costly), the CI pipeline flags errors within seconds of pushing, pinpointing the exact commit and test assertion that failed.
3. **What would happen to the pipeline if the test file path were incorrect — would the workflow fail at the same step as a genuine test failure?**
   No. An assertion failure occurs during test execution inside the test runner (`expect(received).toBe(expected)` failing inside `tests/api.test.js`). If the test path or configuration is incorrect, the runner fails at the test discovery phase (`No tests found matching pattern` or module resolution error), resulting in a runner configuration exit error rather than a logical test failure.

### 4. Supplementary Features Implemented

- **Dual-Job Pipeline**: Separate `lint` job runs first, gatekeeping the dependent `build-and-test` job.
- **Pull Request Triggering**: Pipeline automatically triggers on both `push` and `pull_request` branches targeting `main`.
- **Status Badge**: Real-time CI Pipeline badge embedded at the top of the README.
- **Multiple Endpoint Coverage**: Automated test suite tests authentication, CRUD persistence, and in-memory cache telemetry.

---

## Practical 13: AI API Integration into a Web Application

Practical 13 extends the full-stack Task Management application with an AI-powered assistant that auto-generates task descriptions and suggests priority levels, backed by server-side API security, rate limiting, and graceful degradation fallback.

### 1. Architecture & Information Flow

```text
React Frontend (student-portfolio)
 │ 
 │ 1. User enters Task Title
 │ 2. Clicks "✨ Generate Description with AI"
 ▼
Express Backend (task-manager-api)
 │ Route: POST /api/ai/generate-description
 │ 
 ├── 3. Rate Limiter Middleware (max 1 AI request per 10s per client)
 ├── 4. Read process.env.OPENAI_API_KEY (Server-side ONLY; never in browser)
 │
 ├── [A] API Key Configured & Online:
 │     ▼
 │   Calls OpenAI API (gpt-4o-mini)
 │     │
 │     ▼
 │   Returns JSON { description, priority, fallback: false }
 │
 └── [B] API Key Missing, Invalid, or Provider Outage (Graceful Degradation):
       ▼
     Catch error inside try/catch block
       │
       ▼
     Offline Heuristic Generator generates context-aware description & priority
       │
       ▼
     Returns status 200 JSON { description, priority, fallback: true, fallbackReason, disclaimer }
 │
 ▼
React Frontend UI:
 - Populates editable Description field (student can review, accept, or edit)
 - Suggests Priority (Low, Medium, High)
 - Displays clear AI Disclaimer: "AI-generated suggestion. Please review before saving."
 - Displays Graceful Degradation notice if operating in offline fallback mode
 - Core task management NEVER crashes!
```

### 2. Endpoints Added

| Method | Endpoint | Description | Access Control |
|---|---|---|---|
| `POST` | `/api/ai/generate-description` | Generates a 1-2 sentence task description and suggested priority level from a task title. Features rate-limiting and offline heuristic fallback. | Public / Rate-limited |
| `POST` | `/ai/generate-description` | Alias route for convenience | Public / Rate-limited |

### 3. Key Viva / Analysis Questions Answered

1. **Why must the AI API key be called from the backend rather than directly from the React frontend?**
   - **Credential Security**: React client code runs directly inside user browsers. Any API key embedded or bundled into frontend JavaScript is visible in plaintext via Browser DevTools (Network, Console, and Sources tabs).
   - **Abuse Prevention**: Exposing keys allows malicious actors to scrape credentials, bypass billing quotas, trigger denial-of-service, or run thousands of unauthorized requests at the developer's financial expense. By isolating the call inside an Express route, the key stays in server `.env` memory and is never transmitted over client network connections.
2. **What does 'graceful degradation' mean in this context, and why does it matter for a feature that depends on a third-party service outside your control?**
   - **Definition**: Graceful degradation is an architectural pattern where an application continues to deliver core functionality when an external non-essential service or dependency fails, slows down, or runs out of quota.
   - **Significance**: Third-party APIs (OpenAI, Gemini) are outside our infrastructure control. If our task creation form crashed whenever OpenAI experienced latency, downtime, or invalid credentials, the entire web application would be unusable. By catching exceptions and returning an offline rule-based heuristic description with `fallback: true`, the user can continue creating, editing, and managing tasks uninterrupted.
3. **What are the privacy and governance implications of sending task data to an external AI API, and what kind of data should never be sent this way?**
   - **Privacy Implications**: Data sent to external AI APIs crosses corporate and regional borders, potentially being logged, inspected, or retained by third-party model providers. Organizations must comply with data protection regulations such as GDPR, HIPAA, and DPDP.
   - **Data That Must NEVER Be Sent**:
     - *Personally Identifiable Information (PII)*: Social Security numbers, phone numbers, home addresses, government IDs.
     - *Authentication Credentials*: Passwords, API tokens, JWT secrets, private SSH keys.
     - *Protected Health Information (PHI)*: Medical records, health conditions, prescription details.
     - *Confidential Proprietary Assets*: Non-public source code, financial audits, insider trade secrets.

### 4. Supplementary & Bonus Features Implemented

- **Loading Indicator**: Interactive spinner and "Thinking with AI..." button animation during active generation requests.
- **Client Rate Limiting**: In-memory rate limiter prevents spam and runaway API billing (returns HTTP 429 with remaining cooldown seconds).
- **Mandatory AI Disclaimer**: Visible UI notice warning users that suggestions are machine-generated and must be verified before saving.
- **Fully Editable Suggestions**: AI outputs directly populate two-way data-bound React inputs, allowing students full manual edit control before persisting to MongoDB.
- **Automated Test Suite Expansion**: Jest + Supertest test suite expanded from 5 to 8 tests, covering input validation, rate limiting, and graceful degradation fallback.


---

## Installation & Running Locally (Without Docker)

Follow these steps to run both the frontend and backend development environments simultaneously:

### 1. Run the Backend Server (`task-manager-api`)
1. Navigate to the backend folder:
   ```bash
   cd task-manager-api
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server (runs on port `5001` with auto-restart on changes):
   ```bash
   npm run dev
   ```
   *Note: If local MongoDB is not running, the server will automatically boot up an in-memory database fallback so no setup is required.*

### 2. Run the Frontend Client (`student-portfolio`)
1. Open a new terminal window and navigate to the frontend folder:
   ```bash
   cd student-portfolio
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React client dev server (runs on port `5173`):
   ```bash
   npm run dev
   ```

### 3. Access the Application
- Open your browser and navigate to: [http://localhost:5173/](http://localhost:5173/)
- Click the **Projects** link in the navigation bar to test lazy chunk loading, login/register authentication, and full-stack MongoDB task CRUD!
