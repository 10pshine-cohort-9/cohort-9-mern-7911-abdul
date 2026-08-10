# Notes Hub — Frontend client

This is the React + TypeScript + Vite frontend client for the Notes Hub application.

## Prerequisites

- Node.js (v18 or higher recommended)
- The Notes Hub Backend service running locally or accessible via HTTPS.

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the `frontend` root directory:
   ```env
   # API endpoint origin mapping
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

3. **Run the Development Server**:
   ```bash
   npm run dev
   ```

4. **Production Build**:
   ```bash
   npm run build
   ```

## Key Technologies

- **React 19**
- **Vite**
- **TypeScript**
- **Oxlint** for lightning-fast code analysis.
