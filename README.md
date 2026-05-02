# EASE Backend - NestJS with Multi-Environment Supabase

A premium NestJS backend using **GraphQL** and **REST**, powered by a robust multi-environment infrastructure.

## 🚀 Infrastructure Overview

We use a 3-tier environment strategy to ensure safety and speed:

| Environment | Database | Redis | Purpose |
| :--- | :--- | :--- | :--- |
| **Local** | Docker (Supabase CLI) | Docker (Redis) | Rapid coding & local testing |
| **Staging** | Supabase Cloud (zfek...) | TBD | Final QA & UAT |
| **Production** | Supabase Cloud (dkiw...) | TBD | Live users |

---

## 🛠 Prerequisites

Ensure you have the following installed:
1. **Docker Desktop**: Required for local database and Redis.
2. **Supabase CLI**: `brew install supabase/tap/supabase`
3. **Node.js**: v20 or higher.

---

## 💻 Local Development Setup

### 1. Start Infrastructure
Run these commands to spin up your local database and message queue:
```bash
# Start local Supabase (Postgres, Auth, Studio)
supabase start

# Start local Redis (for BullMQ)
docker run --name ease-redis -p 6379:6379 -d redis
```

### 2. Configure Environment
Your `.env` file is already configured to point to `localhost`.
* **Database UI**: [http://127.0.0.1:54323](http://127.0.0.1:54323)
* **API**: `http://localhost:3000/graphql`

### 3. Run the App
```bash
npm run start:dev
```

---

## 🌳 Git Branching & Deployment

We use branches to control where your code goes. **Never push directly to `main`.**

### 1. Branch Strategy
* **`local`**: Always code here. Test against your local Docker.
* **`staging`**: Push here to trigger the **Automated Staging Pipeline**.
* **`main`**: The production branch. Merge `staging` here when ready to go live.

### 2. Deploying to Staging
Whenever you push to the `staging` branch, a GitHub Action automatically:
1. Connects to your Staging Supabase project.
2. Applies any new SQL migrations in `supabase/migrations/`.
3. (Optional) Deploys the latest backend code.

```bash
git checkout staging
git merge local
git push origin staging  # This triggers the auto-migration!
```

---

## ⚙️ Environment Management

The app is "Environment Aware." You can force a specific environment locally:

```bash
# Test against Staging database from your local machine
NODE_ENV=staging npm run start:dev
```

### Protection Notice
* **Local** uses `.env`
* **Staging** uses `.env.staging`
* **Production** uses environment variables stored in GitHub Secrets (no local `.env.production` file is created for safety).

---

## 🧪 Common Commands

| Command | Description |
| :--- | :--- |
| `supabase db diff --name <name>` | Create a new migration file based on schema changes |
| `supabase db reset` | Wipe local DB and re-run all migrations |
| `docker stop ease-redis` | Stop the local Redis container |
| `npm run test` | Run unit tests |

---

## 📬 API & GraphQL
* **GraphQL Playground**: `http://localhost:3000/graphql`
* **REST API**: `http://localhost:3000/api`
