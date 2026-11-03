# Deploy ThaiTrinh Fashion

The app uses Vercel for the React client, Render for the Express API, Neon for PostgreSQL, and Cloud Run for the PhoBERT API. The model weights stay in the Hugging Face model repository and are downloaded when the AI service starts.

## 1. Deploy the AI service to Cloud Run

The `ai-service/Dockerfile` installs CPU-only PyTorch and starts FastAPI on Cloud Run's `PORT`. From `ai-service`, deploy it with Google Cloud CLI:

```powershell
gcloud auth login
gcloud config set project YOUR_GOOGLE_CLOUD_PROJECT_ID
gcloud run deploy fashion-sentiment --source . --region asia-southeast1 --allow-unauthenticated --cpu 1 --memory 4Gi --concurrency 1 --max-instances 1 --set-env-vars HF_MODEL_ID=thai837790/thaitrinh-sentiment --set-secrets INTERNAL_API_KEY=ai-internal-key:1
```

Before deployment, create a Secret Manager secret named `ai-internal-key` containing a long random value, and grant the Cloud Run runtime service account the Secret Manager Secret Accessor role for that secret. The command attaches it as `INTERNAL_API_KEY`; set the same value directly in Render. Never commit or paste this value into chat. Set a Google Cloud budget alert; the Cloud Run free quota can be exceeded.

After deployment, save the service URL. Check `https://SERVICE_URL/health` and verify it reports `phobert-fashion-v1`.

## 2. Create Neon and preserve the local database data

Create a PostgreSQL database in Neon and use its **direct** connection string (turn off **Connection pooling** in the Neon connection dialog). Keep it private. The existing backup is `server/backups/fashion_db_2026-11-03.dump`; it is intentionally excluded from Git.

In PowerShell, run the import helper from `server`. It asks for the connection string with hidden input, applies the checked-in migrations to the empty Neon database, then restores only saved rows:

```powershell
cd C:\Users\ACER\Documents\fashion-shop\server
.\scripts\import-neon.ps1
```

The helper uses the installed PostgreSQL 18 `pg_restore`. The Neon database must be fresh for this data-only restore. Do not run the old schema dump as a full restore on top of a migrated database.

## 3. Deploy the API to Render

Use **New → Blueprint** in Render and select this GitHub repository. Render reads `render.yaml`, uses `server` as the root directory, generates Prisma Client, applies migrations, and starts the API.

Set these variables in the Render service:

- `DATABASE_URL`: the same Neon direct connection string.
- `JWT_SECRET`: a new long random secret. Existing browser sessions will need to sign in again.
- `AI_SERVICE_URL`: the Cloud Run service URL, without `/predict`.
- `INTERNAL_API_KEY`: the same secret configured on Cloud Run.
- `CORS_ALLOWED_ORIGINS`: the final Vercel origin, for example `https://your-project.vercel.app`.
- `CLIENT_URL`: that same Vercel origin.
- `API_URL`: the public Render service origin, for example `https://fashion-shop-api.onrender.com`.

Wait for the health check at `https://API_URL/api/health` to return `status: ok`.

## 4. Deploy the client to Vercel

Import the same GitHub repository into Vercel and set **Root Directory** to `client`. Use `npm run build` and output directory `dist`. Set this build-time variable:

```text
VITE_API_BASE_URL=https://API_URL/api
```

The `client/vercel.json` rewrite enables deep links such as `/products/...` and `/account` on refresh. Once Vercel provides the final production domain, update `CORS_ALLOWED_ORIGINS` and `CLIENT_URL` in Render, then redeploy the API.

Google/Facebook login and online payment gateways need their provider credentials configured separately. COD and email/password login can be checked without those credentials.
