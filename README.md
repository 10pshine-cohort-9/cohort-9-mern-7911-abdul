# Notes Hub — MERN Stack Application

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![SonarQube](https://img.shields.io/badge/SonarQube-Quality%20Gate%20Passed-4E9BCD?logo=sonarqube&logoColor=white)](https://www.sonarqube.org/)
[![License](https://img.shields.io/badge/Cohort-9%20MERN-FF6B6B)](https://github.com/AbdulHanan546/cohort-9-mern-7911-abdul)

A full-stack, production-ready MERN (MongoDB, Express, React, Node.js) Notes Management web application developed with **TypeScript**, **React 19**, **Vite**, and **Tailored Design System**. Built for **10Pearls Cohort 9 — MERN Assignment** by **Abdul Hanan**.

---

## Table of Contents

- [Features](#features)
- [Tech Stack & Architecture](#tech-stack--architecture)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Step-by-Step Setup Guide](#step-by-step-setup-guide)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Frontend Setup](#3-frontend-setup)
- [Quick Start (Terminal Cheat Sheet)](#quick-start-terminal-cheat-sheet)
- [Environment Variables Reference](#environment-variables-reference)
- [Running Tests & Quality Assurance](#running-tests--quality-assurance)
  - [Backend Tests](#backend-tests)
  - [Frontend Tests & Linting](#frontend-tests--linting)
  - [SonarQube Static Analysis](#sonarqube-static-analysis)
- [API Reference](#api-reference)
- [Security & Best Practices](#security--best-practices)
- [Troubleshooting](#troubleshooting)
- [Author & Acknowledgments](#author--acknowledgments)

---

## Features

- **🔐 Robust Authentication & Session Management**:
  - Secure user signup and signin with email/password validation.
  - Salted password hashing via `bcryptjs`.
  - Stateless JSON Web Token (JWT) bearer authorization.
- **📝 Rich-Text Note Editing**:
  - Powered by **Quill 2.0** WYSIWYG editor.
  - Headings, bold, italics, blockquotes, lists, code blocks, links, and text formatting.
  - Sanitized with **DOMPurify** to protect against Stored Cross-Site Scripting (XSS).
- **📌 Organization, Tagging & Pinning**:
  - Pin important notes to anchor them at the top of your dashboard.
  - Categorize notes with custom tags.
  - Interactive tag pills displaying dynamic count of matching notes with one-click filtering.
- **🔍 Instant Search with Debouncing**:
  - Fast search query bar with 250ms debouncing for responsive title/content filtering.
- **💾 Import & Export**:
  - One-click JSON export of all your notes for backup and portability.
  - Bulk JSON import with schema validation directly from the web client.
- **🎨 Modern Glassmorphism UI**:
  - High-performance, responsive UI with sleek dark aesthetic and smooth micro-animations.
  - Interactive modal dialogs and custom animated toast notifications.
- **🛡️ Enterprise-Grade Reliability & Code Quality**:
  - Clean TypeScript codebase with strict typing.
  - SonarQube verified architecture (zero critical code smells/vulnerabilities).
  - High test coverage across backend controllers and frontend UI components.

---

## Tech Stack & Architecture

### Backend (`/backend`)
- **Runtime**: [Node.js](https://nodejs.org/) (v18+)
- **Framework**: [Express 4.x](https://expressjs.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database / ODM**: [MongoDB](https://www.mongodb.com/) with [Mongoose 8.x](https://mongoosejs.com/)
- **Security**: [Helmet](https://helmetjs.github.io/), [CORS](https://www.npmjs.com/package/cors), [bcryptjs](https://www.npmjs.com/package/bcryptjs), [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)
- **Logging**: [Pino](https://getpino.io/) & [Pino-Pretty](https://github.com/pinojs/pino-pretty)
- **Testing**: [Mocha](https://mochajs.org/), [Chai](https://www.chaijs.com/), [Supertest](https://github.com/ladjs/supertest), [ts-node](https://typestrong.org/ts-node/)

### Frontend (`/frontend`)
- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Rich Text Editor**: [Quill 2.0](https://quilljs.com/)
- **Sanitizer**: [DOMPurify](https://github.com/cure53/DOMPurify)
- **Styling**: Custom CSS Design Tokens & Glassmorphic Components
- **Linter**: [Oxlint](https://oxc.rs/)
- **Testing**: [Jest 30](https://jestjs.io/), [@testing-library/react](https://testing-library.com/), [ts-jest](https://kulshekhar.github.io/ts-jest/)

---

## Repository Structure

```text
cohort-9-mern-7911-abdul/
├── .coderabbit.yaml           # CodeRabbit code review rules
├── .gitignore                 # Top-level git ignore configuration
├── README.md                  # Project documentation & setup guide
├── sonar-project.properties   # SonarQube static analysis configuration
├── docs/                      # Screenshots & verification artifacts
│   ├── Screenshot 2026-08-27 024316.png
│   ├── Screenshot 2026-08-27 024329.png
│   ├── Screenshot 2026-08-27 024343.png
│   └── Screenshot 2026-08-27 024402.png
├── backend/                   # Node.js + Express + Mongoose API server
│   ├── .env.example           # Example backend environment variables
│   ├── package.json           # Backend dependencies and scripts
│   ├── tsconfig.json          # TypeScript configuration for backend
│   └── src/
│       ├── app.ts             # Express app setup and middleware configuration
│       ├── server.ts          # Server initialization and env validation
│       ├── config/            # DB connection & environment helpers
│       ├── controllers/       # Auth and Notes business logic & specs
│       ├── middleware/        # JWT auth, error handler, request logger
│       ├── models/            # Mongoose schemas (User, Note)
│       ├── routes/            # Express routers (/api/auth, /api/notes)
│       └── utils/             # Pino logger instance
└── frontend/                  # React 19 + TypeScript + Vite web app
    ├── .env.example           # Example frontend environment variables
    ├── index.html             # HTML entry point
    ├── jest.config.ts         # Jest testing configuration
    ├── package.json           # Frontend dependencies and scripts
    ├── tsconfig.json          # TypeScript configuration for frontend
    ├── vite.config.ts         # Vite build configuration
    └── src/
        ├── App.tsx            # Main application shell and session state
        ├── index.css          # Design system, variables, and utility classes
        ├── main.tsx           # React DOM root render
        ├── components/        # Auth, Dashboard, NoteEditor, Quill, Toast
        │   └── __tests__/     # Component unit and integration tests
        └── utils/             # API client with token management and types
```

---

## Prerequisites

Ensure you have the following installed on your machine before getting started:

1. **Node.js**: `v18.0.0` or higher ([Download Node.js](https://nodejs.org/))
2. **npm**: `v9.0.0` or higher (comes bundled with Node.js)
3. **MongoDB**:
   - **Local instance**: MongoDB Community Server running on `mongodb://localhost:27017` ([Install MongoDB](https://www.mongodb.com/try/download/community)), OR
   - **Cloud instance**: [MongoDB Atlas](https://www.mongodb.com/atlas) connection URI.
4. **Git**: Installed and configured ([Download Git](https://git-scm.com/))

---

## Step-by-Step Setup Guide

### 1. Clone Repository

```bash
git clone https://github.com/AbdulHanan546/cohort-9-mern-7911-abdul.git
cd cohort-9-mern-7911-abdul
```

---

### 2. Backend Setup

Open your terminal and navigate into the `backend` directory:

```bash
cd backend
```

#### Step A: Install Dependencies
```bash
npm install
```

#### Step B: Set Up Environment Variables
Create your local `.env` file from `.env.example`:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Linux / macOS:**
```bash
cp .env.example .env
```

Open `.env` in your editor and configure the parameters:
```env
PORT=5000
NODE_ENV=development

# Database Configuration (Local or Atlas)
MONGODB_URI=mongodb://localhost:27017/notes_db

# JWT Secret (Use a strong random secret; min 32 chars required in production)
JWT_SECRET=supersecretjwtkey_change_in_production
JWT_EXPIRES_IN=7d

# CORS Allowed Origin (Frontend URL)
FRONTEND_URL=http://localhost:5173
```

#### Step C: Ensure MongoDB is Running
If using local MongoDB, verify that your service is active:
- **Windows**: Check that the `MongoDB` service is running in `services.msc` or run `net start MongoDB`.
- **macOS / Linux**: `sudo systemctl status mongod` or `brew services start mongodb-community`.

#### Step D: Start the Backend Server
- **Development Mode (with auto-reload using `tsx`):**
  ```bash
  npm run dev
  ```
  The API will start at `http://localhost:5000` and display:
  ```
  {"level":30,"msg":"MongoDB database connection established successfully."}
  {"level":30,"msg":"Server running in development mode on port 5000"}
  ```

- **Production Build & Start:**
  ```bash
  npm run build
  npm start
  ```

---

### 3. Frontend Setup

In a new terminal window, navigate into the `frontend` directory:

```bash
cd frontend
```

#### Step A: Install Dependencies
```bash
npm install
```

#### Step B: Set Up Environment Variables
Create your local `.env` file from `.env.example`:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Linux / macOS:**
```bash
cp .env.example .env
```

The default contents point to the local backend:
```env
# API endpoint origin mapping
VITE_API_BASE_URL=http://localhost:5000/api
```

#### Step C: Start the Development Server
```bash
npm run dev
```

The Vite dev server will spin up:
```text
  VITE v8.2.0  ready in 220 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open your browser and navigate to **`http://localhost:5173`** to access the Notes Hub application.

---

## Quick Start (Terminal Cheat Sheet)

Run the backend and frontend concurrently in two separate terminal windows:

| Terminal | Path | Command | URL |
| :--- | :--- | :--- | :--- |
| **Terminal 1 (Backend)** | `./backend` | `npm install && npm run dev` | `http://localhost:5000` |
| **Terminal 2 (Frontend)** | `./frontend` | `npm install && npm run dev` | `http://localhost:5173` |

---

## Environment Variables Reference

### Backend (`/backend/.env`)

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Number | `5000` | Port where Express API listens (must be between 1 and 65535). |
| `NODE_ENV` | String | `development` | Environment mode (`development`, `production`, `test`). |
| `MONGODB_URI` | String | `mongodb://localhost:27017/notes_db` | MongoDB connection string (local or MongoDB Atlas). |
| `JWT_SECRET` | String | *Required* | Secret key for signing and verifying JWT tokens. In production, this must be a unique UTF-8 string with a minimum length of 32 bytes. |
| `JWT_EXPIRES_IN` | String | `7d` | Expiration window for JWT tokens (e.g., `1d`, `7d`, `24h`). |
| `FRONTEND_URL` | String | `http://localhost:5173` | Allowed origin for CORS headers. |

### Frontend (`/frontend/.env`)

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | String | `http://localhost:5000/api` | Base URL pointing to the Express backend API. |

---

## Running Tests & Quality Assurance

### Backend Tests
The backend uses **Mocha**, **Chai**, and **Supertest** for testing API endpoints and controller logic:

```bash
cd backend
npm test
```

### Frontend Tests & Linting
The frontend uses **Jest**, **React Testing Library**, and **ts-jest** for component unit and integration testing, alongside **Oxlint** for fast static analysis:

```bash
cd frontend

# Run Jest unit and component tests
npm test

# Run code linter
npm run lint

# Build production bundle and check TypeScript types
npm run build
```

### SonarQube Static Analysis
The project includes a pre-configured `sonar-project.properties` setup for SonarQube code quality and coverage tracking.

1. Ensure SonarQube is running (default: `http://localhost:9000`).
2. Run test coverage generation in both directories:
   - Backend: creates `backend/coverage/lcov.info`
   - Frontend: creates `frontend/coverage/lcov.info`
3. Execute `sonar-scanner` in the root repository directory:
   ```bash
   sonar-scanner
   ```
4. Analysis reports, coverage, and quality gate results are documented in the [`docs/`](./docs) directory.

---

## API Reference

Base URL: `http://localhost:5000/api`

### Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Auth Required | Description | Request Body |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/signup` | No | Register a new user | `{ "name": "John", "email": "john@example.com", "password": "password123" }` |
| `POST` | `/signin` | No | Log in and receive JWT token | `{ "email": "john@example.com", "password": "password123" }` |
| `POST` | `/login` | No | Alias for `/signin` | `{ "email": "john@example.com", "password": "password123" }` |
| `GET` | `/me` | Yes (`Bearer <token>`) | Get profile of logged-in user | None |
| `POST` | `/logout` | Yes (`Bearer <token>`) | User logout / session invalidation | None |

### Notes Endpoints (`/api/notes`)

All notes endpoints require the `Authorization: Bearer <token>` header.

| Method | Endpoint | Description | Query Parameters / Payload |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Fetch all user notes | `?search=<query>` (filter title/content)<br>`?isPinned=true\|false` |
| `POST` | `/` | Create a new note | `{ "title": "Note Title", "content": "<p>Content</p>", "tags": ["work"], "isPinned": false }` |
| `GET` | `/:id` | Fetch single note by ID | None |
| `PUT` | `/:id` | Update an existing note | `{ "title": "Updated Title", "content": "<p>New</p>", "tags": ["idea"], "isPinned": true }` |
| `DELETE` | `/:id` | Delete note by ID | None |
| `GET` | `/export` | Export all notes as a JSON array | None |
| `POST` | `/import` | Bulk import notes from JSON | `{ "notes": [ { "title": "...", "content": "...", "tags": [...] } ] }` |

---

## Security & Best Practices

- **Strict Environment Validation**: `server.ts` validates required environment variables during boot. In `production`, startup fails fast if `JWT_SECRET` uses default/weak strings or is shorter than 32 bytes.
- **XSS Prevention**: Rich-text HTML content created in the Quill editor is sanitized on both render and display using `DOMPurify.sanitize()`.
- **Password Protection**: Passwords are never stored in plain text; they are hashed with `bcryptjs` with salt before being saved to MongoDB.
- **HTTP Hardening**: `helmet` is configured to set security HTTP headers, mitigating cross-site scripting, clickjacking, and MIME-type sniffing.
- **Safe Database Queries**: User IDs from authenticated JWT tokens are automatically bound to all Mongoose queries, preventing unauthorized data leakage or horizontal privilege escalation.

---

## Troubleshooting

### 1. MongoDB Connection Failed (`Unable to connect to MongoDB`)
- Verify that your local MongoDB server is active (`net start MongoDB` on Windows or `mongod`).
- If using MongoDB Atlas, check your network whitelist (IP Access List) in Atlas dashboard and verify your username and password in `MONGODB_URI`.

### 2. Backend fails on startup with `JWT_SECRET must be at least 32 bytes`
- In `NODE_ENV=production`, the application requires a cryptographically strong secret.
- Generate a secure key (e.g. using `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) and update `JWT_SECRET` in `.env`.

### 3. Port Conflict (`EADDRINUSE: address already in use :::5000`)
- Another process is using port `5000`. You can change `PORT=5001` in `backend/.env` and update `VITE_API_BASE_URL=http://localhost:5001/api` in `frontend/.env`.

### 4. CORS Error in Browser Console
- Ensure that `FRONTEND_URL` in `backend/.env` matches the exact protocol and port of the frontend client (`http://localhost:5173`).

---

## Author & Acknowledgments

- **Developer**: [Abdul Hanan](https://github.com/AbdulHanan546)
- **Program**: 10Pearls Cohort 9 — MERN Stack Specialization
- **Repository**: [AbdulHanan546/cohort-9-mern-7911-abdul](https://github.com/AbdulHanan546/cohort-9-mern-7911-abdul)
