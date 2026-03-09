# eXalt Classement

Simple web app to manage team rankings:
- login (admin or guest)
- create teams with participants
- add/remove points
- live classement (ranking)
- podium top 3
- history log of actions
- shared server-side data storage (file database)

---

## What we built

This repository contains a lightweight front-end app (HTML/CSS/JS) with:

- **Authentication modes**
  - Admin mode: can create/update/delete team data
  - Guest mode (`invité`): read-only access

- **Team management**
  - Create a team
  - Add participants (comma or newline separated)
  - Update points manually (+/-)
  - Delete teams

- **Ranking dashboard**
  - Metrics: teams / participants / total points
  - Classement table with participant chips
  - Podium section for top 3 teams
  - History log for key actions

- **Quality setup**
  - Unit tests with Vitest
  - Coverage generation (`lcov`)
  - Sonar configuration

- **CI/CD**
  - GitHub Actions CI (tests + optional Sonar scan)
  - GitHub Pages deployment workflow

---

## Tech stack

- HTML5
- CSS3
- Vanilla JavaScript
- Vitest (unit tests)
- GitHub Actions (CI + Deploy)

---

## Project structure

- `index.html` → app layout
- `style.css` → UI styling (cleaned and mobile-friendly)
- `app.js` → main app logic and interactions
- `server.js` → Express API + persistent shared JSON DB (lowdb)
- `logic.js` → shared logic module (also unit tested)
- `tests/logic.test.js` → unit tests
- `.github/workflows/ci.yml` → CI pipeline
- `.github/workflows/deploy.yml` → GitHub Pages deployment pipeline
- `sonar-project.properties` → Sonar scanner config

---

## Login credentials

### Admin
- `exalt_2025` / `exalt_2025`
- also supports `eXalt_2025` / `eXalt_2025`

### Guest
- Click **Entrer en invité**
- Guest cannot modify data

> Note: credentials are currently hardcoded for demo/internal usage.

---

## Run locally

### 1) Install dependencies
```bash
npm install
```

### 2) Start app server (shared DB)
```bash
npm start
```

Then open:
`http://localhost:3000`

### API base URL configuration

- Frontend requests use `config.js` (`API_BASE_URL`)
- For local full-stack usage with `npm start`, keep:

```js
globalThis.API_BASE_URL = "";
```

- For GitHub Pages frontend + hosted backend, set:

```js
globalThis.API_BASE_URL = "https://your-backend-domain";
```

Example:

```js
globalThis.API_BASE_URL = "https://exalt-classement-api.onrender.com";
```

### 3) Run tests
```bash
npm test
```

The shared database file is created automatically in:
- `data/exalt_classement.json`

---

## Unit tests

Tests are written for core logic in `logic.js`:
- participant parsing
- HTML escaping
- team normalization
- history normalization
- team sorting

Run:
```bash
npm test
```

Coverage output:
- terminal summary
- `coverage/lcov.info`

---

## CI (GitHub Actions)

Workflow: `.github/workflows/ci.yml`

On push/PR to `main`:
1. install deps (`npm ci`)
2. run tests + coverage
3. optionally run Sonar scan if secrets are set

### Required secrets for Sonar job
- `SONAR_TOKEN`
- `SONAR_HOST_URL`
- `SONAR_ORGANIZATION` (required only for SonarCloud)

If these are not set, tests still run and Sonar job is skipped.

---

## Deployment (GitHub Pages)

Workflow: `.github/workflows/deploy.yml`

On push to `main`:
1. run tests
2. package static files
3. deploy to GitHub Pages

### One-time GitHub setting
Repository → **Settings** → **Pages**
- Source: **GitHub Actions**

Expected URL:
- `https://ezzeay.github.io/eXalt_Classement/`

> Important: GitHub Pages is static hosting. Shared server-side data requires running `server.js` on a backend host (Render/Railway/Fly.io/VM).

---

## Sonar configuration

`sonar-project.properties` is included and points to:
- sources
- tests
- exclusions
- JS coverage report path (`coverage/lcov.info`)

---

## Notes / next improvements

Possible next steps:
- move credentials to environment/config management
- add persistent backend API (instead of localStorage)
- add role-based multi-user accounts
- add E2E tests (Playwright/Cypress)
- add export (CSV/PDF) for classement

---

## Author

Ahmed Ezzarzari
