# Image uploads to Cloudflare R2

The image bytes are uploaded directly from the browser to a private Cloudflare R2 bucket. Django creates a pending image record, signs a short-lived `PUT` URL, and verifies the stored object when the client finalizes the upload.

## Backend environment variables

For local development, Django loads `api/.env` with `python-dotenv`. Copy `.env.example` to `.env` when setting up a fresh checkout, then generate a local secret key with `python3 -c 'import secrets; print(secrets.token_urlsafe(50))'` and put it in `DJANGO_SECRET_KEY`. A local `.env` has already been created for this checkout.

The `.env` file is ignored by Git. For deployed environments, set variables in the hosting platform instead. Shell/deployment variables take precedence over `.env` values.

```bash
DJANGO_SECRET_KEY=your-generated-secret-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=your-private-bucket-name
R2_UPLOAD_URL_TTL_SECONDS=300
MAX_IMAGE_UPLOAD_BYTES=10485760
```

The R2 API token should have Object Read & Write access scoped to this bucket. The API uses the credentials server-side and never returns them to the browser.

The default upload URL expires after five minutes and images are limited to 10 MiB. The completion endpoint checks the actual object size and verifies the JPEG/PNG bytes and dimensions before marking the record `ready`.

## Configure bucket CORS

For browser uploads, add the policy in `r2-cors.json` to the bucket's CORS settings. Add the deployed frontend origin to `AllowedOrigins` before production use. Keep public bucket access disabled.

## API flow

1. `POST /api/projects/{project_id}/images/` with JSON metadata:

   ```json
   {
     "file_name": "sample.png",
     "content_type": "image/png",
     "file_size": 24576
   }
   ```

   The response includes an `image.id`, a short-lived `upload.url`, `upload.method` (`PUT`), and the required `Content-Type` header.

2. The browser sends the raw file bytes to `upload.url` with the returned `Content-Type` header. This is a `PUT` request to R2, not a multipart request to Django.

3. After R2 returns success, call `POST /api/projects/{project_id}/images/{image_id}/complete/`. Django checks the object and changes its status from `pending` to `ready`.

`GET /api/projects/{project_id}/images/` lists image records for the project. Swagger docs are available at `/api/docs/` when the backend is running.
