import boto3
from botocore.config import Config
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured


def get_r2_client():
    required = {
        'R2_ACCOUNT_ID': settings.R2_ACCOUNT_ID,
        'R2_ACCESS_KEY_ID': settings.R2_ACCESS_KEY_ID,
        'R2_SECRET_ACCESS_KEY': settings.R2_SECRET_ACCESS_KEY,
        'R2_BUCKET_NAME': settings.R2_BUCKET_NAME,
    }
    missing = [name for name, value in required.items() if not value]
    if missing:
        raise ImproperlyConfigured(
            f"R2 storage is not configured. Missing environment variables: {', '.join(missing)}"
        )

    client = boto3.client(
        's3',
        endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        region_name='auto',
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        config=Config(signature_version='s3v4'),
    )
    return client, settings.R2_BUCKET_NAME


def create_upload_url(*, object_key, content_type):
    client, bucket_name = get_r2_client()
    url = client.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': bucket_name,
            'Key': object_key,
            'ContentType': content_type,
        },
        ExpiresIn=settings.R2_UPLOAD_URL_TTL_SECONDS,
    )
    return url


def create_download_url(*, object_key):
    client, bucket_name = get_r2_client()
    return client.generate_presigned_url(
        'get_object',
        Params={'Bucket': bucket_name, 'Key': object_key},
        ExpiresIn=settings.R2_READ_URL_TTL_SECONDS,
    )
