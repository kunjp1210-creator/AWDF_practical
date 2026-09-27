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
