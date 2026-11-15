# XTOP Retail

A full-stack retail web application built with React, Vite, Express, and Supabase.

This repository contains a React frontend and an Express server, with Supabase-backed application services and email integration dependencies.

## Technology stack

- React 19 and Vite
- Node.js and Express
- Supabase JavaScript client
- TypeScript tooling
- Tailwind CSS
- Motion
- Resend integration
- esbuild for server bundling

## Local development

**Requirements:** Node.js and npm.

```bash
git clone https://github.com/erodion4776/Xtop-retail.git
cd Xtop-retail
npm install
npm run dev
```

## Build and run

```bash
npm run build
npm start
```

The build script creates the frontend bundle and bundles the Express server into `dist/server.cjs`.

## Configuration and security

Configure required environment variables in your local environment or hosting provider. Never commit API keys, Supabase service-role keys, email credentials, or customer data. Review server routes and authorization before exposing administrative functions publicly.

## Project status

An evolving full-stack application. Refer to the current source code and deployment settings for the exact state of each workflow.

## Maintainer

**Ero Osarodion Odion** — [@erodion4776](https://github.com/erodion4776)
