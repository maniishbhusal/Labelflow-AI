import io
import warnings
from uuid import uuid4

from botocore.exceptions import BotoCoreError, ClientError
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema
from PIL import Image, UnidentifiedImageError
from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Project, ProjectImage
from .serializers import ProjectSerializer
from .storage import create_upload_url, get_r2_client
from .upload_serializers import (
    ImageUploadIntentResponseSerializer,
    ImageUploadIntentSerializer,
    ProjectImageSerializer,
)


class StorageUnavailable(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = 'Image storage is unavailable or not configured.'
    default_code = 'storage_unavailable'


class UploadNotComplete(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'The image has not reached storage yet.'
    default_code = 'upload_not_complete'


class ProjectImageCollectionView(APIView):
    @extend_schema(responses=ProjectImageSerializer(many=True), tags=['images'])
    def get(self, request, project_id):
        project = get_object_or_404(Project, pk=project_id)
        images = ProjectImage.objects.filter(project=project)
        return Response(ProjectImageSerializer(images, many=True).data)

    @extend_schema(
        request=ImageUploadIntentSerializer,
        responses={
            201: ImageUploadIntentResponseSerializer,
            400: OpenApiResponse(description='Invalid filename, content type, or file size.'),
            404: OpenApiResponse(description='Project was not found.'),
            503: OpenApiResponse(description='R2 storage is not configured or unavailable.'),
        },
        tags=['images'],
        summary='Start a direct-to-R2 image upload',
        description=(
            'Creates a pending image record and returns a short-lived presigned PUT URL. '
            'Upload the raw image bytes to that URL with the returned Content-Type header, '
            'then call the image completion endpoint.'
        ),
    )
    def post(self, request, project_id):
        project = get_object_or_404(Project, pk=project_id)
        serializer = ImageUploadIntentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data

        suffix = '.jpg' if values['content_type'] == 'image/jpeg' else '.png'
        object_key = f'projects/{project.pk}/images/{uuid4().hex}{suffix}'

        try:
            # Check configuration before creating a pending row.
            get_r2_client()
            image = ProjectImage.objects.create(
                project=project,
                object_key=object_key,
                original_filename=values['file_name'],
                content_type=values['content_type'],
                expected_size=values['file_size'],
            )
            upload_url = create_upload_url(
                object_key=object_key,
                content_type=values['content_type'],
            )
        except (BotoCoreError, ClientError, ImproperlyConfigured) as exc:
            if 'image' in locals():
                image.delete()
            raise StorageUnavailable() from exc

        return Response(
            {
                'image': ProjectImageSerializer(image).data,
                'upload': {
                    'method': 'PUT',
                    'url': upload_url,
                    'headers': {'Content-Type': values['content_type']},
                    'expires_in': settings.R2_UPLOAD_URL_TTL_SECONDS,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class ProjectImageCompleteView(APIView):
    @extend_schema(
        request=None,
        responses={
            200: ProjectImageSerializer,
            400: OpenApiResponse(description='Uploaded object is not a valid supported image.'),
            404: OpenApiResponse(description='Project or image record was not found.'),
            409: OpenApiResponse(description='The browser has not finished uploading the image.'),
            503: OpenApiResponse(description='R2 storage is not configured or unavailable.'),
        },
        tags=['images'],
        summary='Confirm and validate an uploaded image',
        description=(
            'Call after the browser receives a successful response from the presigned R2 PUT. '
            'The API checks the object and image bytes before marking it ready.'
        ),
    )
    def post(self, request, project_id, image_id):
        image = get_object_or_404(ProjectImage, pk=image_id, project_id=project_id)
        if image.status == ProjectImage.Status.READY:
            return Response(ProjectImageSerializer(image).data)

        try:
            client, bucket_name = get_r2_client()
            try:
                metadata = client.head_object(Bucket=bucket_name, Key=image.object_key)
            except ClientError as exc:
                error_code = exc.response.get('Error', {}).get('Code')
                if error_code in {'404', 'NoSuchKey', 'NotFound'}:
                    raise UploadNotComplete() from exc
                raise

            actual_size = metadata.get('ContentLength', 0)
            actual_content_type = metadata.get('ContentType', '')
            if actual_size != image.expected_size:
                self._fail_and_remove(client, bucket_name, image)
                raise ValidationError({'file': 'Uploaded size did not match the declared size.'})
            if actual_size > settings.MAX_IMAGE_UPLOAD_BYTES:
                self._fail_and_remove(client, bucket_name, image)
                raise ValidationError({'file': 'Image exceeds the maximum upload size.'})
            if actual_content_type != image.content_type:
                self._fail_and_remove(client, bucket_name, image)
                raise ValidationError(
                    {'file': 'Uploaded Content-Type did not match the signed type.'}
                )

            response = client.get_object(Bucket=bucket_name, Key=image.object_key)
            body = response['Body']
            try:
                image_bytes = body.read(settings.MAX_IMAGE_UPLOAD_BYTES + 1)
            finally:
                body.close()

            if (
                len(image_bytes) != actual_size
                or len(image_bytes) > settings.MAX_IMAGE_UPLOAD_BYTES
            ):
                self._fail_and_remove(client, bucket_name, image)
                raise ValidationError({'file': 'Uploaded image size is invalid.'})

            try:
                width, height, detected_content_type = self._inspect_image(image_bytes)
            except ValidationError:
                self._fail_and_remove(client, bucket_name, image)
                raise
            if detected_content_type != image.content_type:
                self._fail_and_remove(client, bucket_name, image)
                raise ValidationError(
                    {'file': 'File contents do not match the declared image type.'}
                )

            image.file_size = actual_size
            image.width = width
            image.height = height
            image.status = ProjectImage.Status.READY
            image.uploaded_at = timezone.now()
            image.save(update_fields=('file_size', 'width', 'height', 'status', 'uploaded_at'))
        except (BotoCoreError, ClientError, ImproperlyConfigured) as exc:
            raise StorageUnavailable() from exc

        return Response(ProjectImageSerializer(image).data)

    @staticmethod
    def _inspect_image(image_bytes):
        try:
            with warnings.catch_warnings():
                warnings.simplefilter('error', Image.DecompressionBombWarning)
                with Image.open(io.BytesIO(image_bytes)) as opened_image:
                    image_format = opened_image.format
                    width, height = opened_image.size
                    opened_image.verify()
        except (
            UnidentifiedImageError,
            OSError,
            Image.DecompressionBombError,
            Image.DecompressionBombWarning,
        ) as exc:
            raise ValidationError({'file': 'File is not a valid JPEG or PNG image.'}) from exc

        content_type_by_format = {'JPEG': 'image/jpeg', 'PNG': 'image/png'}
        content_type = content_type_by_format.get(image_format)
        if content_type is None or width < 1 or height < 1:
            raise ValidationError({'file': 'Only valid JPEG and PNG images are accepted.'})
        return width, height, content_type

    @staticmethod
    def _fail_and_remove(client, bucket_name, image):
        image.status = ProjectImage.Status.FAILED
        image.save(update_fields=('status',))
        try:
            client.delete_object(Bucket=bucket_name, Key=image.object_key)
        except (BotoCoreError, ClientError):
            # The failed row remains available for a later storage cleanup task.
            pass


class ProjectListCreateView(APIView):
    @extend_schema(responses=ProjectSerializer(many=True), tags=['projects'])
    def get(self, request):
        projects = Project.objects.all()
        return Response(ProjectSerializer(projects, many=True).data)

    @extend_schema(request=ProjectSerializer, responses={201: ProjectSerializer}, tags=['projects'])
    def post(self, request):
        serializer = ProjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = serializer.save()
        return Response(ProjectSerializer(project).data, status=status.HTTP_201_CREATED)
