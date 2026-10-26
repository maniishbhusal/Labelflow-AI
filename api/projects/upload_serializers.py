from rest_framework import serializers

from django.conf import settings

from .models import ProjectImage
from .storage import create_download_url


class ImageUploadIntentSerializer(serializers.Serializer):
    file_name = serializers.CharField(max_length=255, trim_whitespace=True)
    content_type = serializers.ChoiceField(choices=('image/jpeg', 'image/png'))
    file_size = serializers.IntegerField(min_value=1)

    def validate_file_name(self, value):
        file_name = value.replace('\\', '/').rsplit('/', 1)[-1].strip()
        if not file_name:
            raise serializers.ValidationError('A filename is required.')
        return file_name

    def validate_file_size(self, value):
        if value > settings.MAX_IMAGE_UPLOAD_BYTES:
            max_mb = settings.MAX_IMAGE_UPLOAD_BYTES // (1024 * 1024)
            raise serializers.ValidationError(f'Image must be no larger than {max_mb} MB.')
        return value


class ProjectImageSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = ProjectImage
        fields = (
            'id',
            'original_filename',
            'content_type',
            'file_size',
            'width',
            'height',
            'status',
            'download_url',
            'created_at',
            'uploaded_at',
        )
        read_only_fields = fields

    def get_download_url(self, image):
        if image.status != ProjectImage.Status.READY:
            return None
        return create_download_url(object_key=image.object_key)


class UploadDetailsSerializer(serializers.Serializer):
    method = serializers.ChoiceField(choices=('PUT',))
    url = serializers.URLField()
    headers = serializers.DictField(child=serializers.CharField())
    expires_in = serializers.IntegerField()


class ImageUploadIntentResponseSerializer(serializers.Serializer):
    image = ProjectImageSerializer()
    upload = UploadDetailsSerializer()
