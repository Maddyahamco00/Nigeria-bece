# Nigeria BECE Portal

This repository contains the Nigeria BECE admin and student portal built with Node.js, Express, EJS templates and Sequelize (MySQL).

This README includes instructions to push your code to GitHub, set up CI, and deploy to a hosting provider such as Render.

## Quick local run

1. Install dependencies:

```powershell
npm ci
```

2. Create a `.env` file with your DB and session secrets (see `.env.example` if provided).

3. Start dev server:

```powershell
npm run dev
```

App runs on http://localhost:3000

## Prepare and push to GitHub (PowerShell)

If your local repository is not yet connected to GitHub, run:

```powershell
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/Maddyahamco00/Nigeria-bece.git

git branch -M main
git push -u origin main
```

If the repository already exists and you only need to push changes:

```powershell
git add .
git commit -m "Your concise message"
git push
```

If you see authentication errors, make sure you have a GitHub PAT or SSH key configured. Using HTTPS with a PAT is simplest for CI.

## Continuous Integration (GitHub Actions)

A basic GitHub Actions workflow is included which installs dependencies and runs `npm ci` and `npm test` (if present). The workflow will run on pushes and pull requests.

## Deploying to Render (recommended)

Render is easy to connect to a GitHub repo and supports Node apps out of the box.

1. Sign up at https://render.com and connect your GitHub account.
2. Create a new "Web Service" and pick this repository.
3. Use these settings:
   - Build Command: `npm ci`
   - Start Command: `npm start` (or `npm run start`)
   - Instance Port: `3000`
4. Add environment variables in Render (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, SESSION_SECRET, etc.).

Render will automatically deploy on every push to the connected branch.

## Optional: Docker

There is a `Dockerfile` included if you prefer container deployments.

## Next steps I can help with
- Create the GitHub repository and push for you (I can show commands or help create a PAT).
- Configure Render deployment step-by-step and add necessary secrets.
- Add a full GitHub Actions deployment workflow (to Render, Heroku, or Docker Registry) if you prefer automated deploys from GitHub.

Tell me which actions you want me to perform next and I will prepare any needed files or command sequences.
