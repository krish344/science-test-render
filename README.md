# Science Test — Render-ready app

This repository is a small web app that hosts a science multiple-choice test and stores the results.

Features
- Student-facing single-page app to take the test.
- Server-side scoring and result storage.
- Admin results page (protected by ADMIN_TOKEN).
- Works with Postgres (via DATABASE_URL) or SQLite fallback.

Environment variables
- ADMIN_TOKEN (required to view admin results)
- DATABASE_URL (optional — if provided, Postgres will be used)

Run locally
1. Copy .env.example to .env and add ADMIN_TOKEN (and optionally DATABASE_URL).
2. npm install
3. npm start
4. Open http://localhost:3000

Deploying on Render
1. Create a GitHub repo and push this project.
2. On Render: New → Web Service → connect your repo.
3. Build command: npm install
4. Start command: npm start
5. Add environment variable ADMIN_TOKEN
6. (Optional) Create a Postgres database on Render and set DATABASE_URL to the connection string.

API endpoints
- GET /api/test — returns the test (answers are not included).
- POST /api/results — submit { name, email, answers: {questionId: choiceIndex} }, returns {score, total, correctAnswers: {...}}
- GET /api/results — returns stored results (requires header Authorization: Bearer <ADMIN_TOKEN>)

Notes about persistence
- If you provide DATABASE_URL (Postgres), results are persisted in Postgres — recommended for production.
- If you do not provide DATABASE_URL, the app uses an on-disk SQLite database at data/results.db. On Render, the disk is ephemeral across deploys, so use Postgres to keep data durable.

License: MIT