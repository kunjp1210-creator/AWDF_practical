# Advanced Web Development Frameworks (AWDF) - Full-Stack Practicals

This repository contains the complete practical assignments for **Advanced Web Development Frameworks (ITUE301)** completed by **Kunj Patel**. It is structured as a full-stack monorepo separating the frontend React app and the backend Express/MongoDB REST API.

## Monorepo Directory Structure

- **[`student-portfolio/`](./student-portfolio)**: Frontend Single Page Application (SPA) built using Vite + React 18 + React Router v6. (Includes theme switcher, search routing, and the integrated Database Task Manager UI).
- **[`task-manager-api/`](./task-manager-api)**: Backend REST API server built using Node.js + Express.js + Mongoose (MongoDB). (Includes task models, custom validation formatting, and automated fallback database).

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
- Click the **Projects** link in the navigation bar to access the interactive **Database Task Manager** running CRUD requests to the backend server.
