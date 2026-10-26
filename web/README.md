# LabelFlow AI frontend

The frontend is a React, TypeScript, and Vite app for creating projects and uploading JPG/PNG images to a project's private Cloudflare R2 storage.

## Run locally

Start Django in one terminal:

```bash
cd api
uv run python manage.py runserver
```

Start Vite in another terminal:

```bash
cd web
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`). Vite forwards `/api/` requests to Django at `http://127.0.0.1:8000`, so a separate Django CORS setup is not needed for local API requests.

## Image upload setup

The browser asks Django for a short-lived presigned upload URL, sends the image bytes directly to R2, then asks Django to verify the object. For uploads to work:

1. Set the Cloudflare R2 variables in `api/.env` as described in `api/README.md`.
2. Apply `api/r2-cors.json` to the R2 bucket. The allowed origin must include the exact Vite origin, usually `http://localhost:5173`, and allow `PUT` with the `Content-Type` header.
3. Keep the bucket private. Django returns short-lived download URLs for ready images so the gallery can display them.

The upload form currently accepts JPG/JPEG and PNG images up to 10 MB.

## API base URL

For local development, the Vite proxy is used automatically. If the frontend and API are hosted separately, set `VITE_API_BASE_URL` to the API origin, for example `https://api.example.com`, and configure the API and R2 bucket CORS policies for the deployed frontend origin.
