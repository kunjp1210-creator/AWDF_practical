# Advanced Web Development Frameworks (AWDF) - Full-Stack Practicals

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

## Installation & Running Locally

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
