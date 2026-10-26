from rest_framework import serializers

from .models import Annotation, AnnotationJob


class DenseDetectionRequestSerializer(serializers.Serializer):
    labels = serializers.ListField(
        child=serializers.CharField(max_length=255, trim_whitespace=True),
        allow_empty=False,
        max_length=50,
    )

    def validate_labels(self, value):
        labels = [label.strip() for label in value]
        if not all(labels):
            raise serializers.ValidationError('Labels cannot be blank.')
        if len(set(labels)) != len(labels):
            raise serializers.ValidationError('Labels must be unique.')
        return labels


class AnnotationJobSerializer(serializers.ModelSerializer):
    image_id = serializers.IntegerField(read_only=True)
    labels = serializers.ListField(source='target_labels', read_only=True)

    class Meta:
        model = AnnotationJob
        fields = (
            'id',
            'image_id',
            'task',
            'labels',
            'status',
            'error_detail',
            'requested_at',
            'started_at',
            'completed_at',
        )
        read_only_fields = fields


class AnnotationSerializer(serializers.ModelSerializer):
    image_id = serializers.IntegerField(read_only=True)
    job_id = serializers.IntegerField(read_only=True)
    bounding_box = serializers.SerializerMethodField()

    class Meta:
        model = Annotation
        fields = (
            'id',
            'image_id',
            'job_id',
            'label',
            'bounding_box',
            'source',
            'review_status',
            'created_at',
            'updated_at',
        )
        read_only_fields = fields

    def get_bounding_box(self, annotation):
        return {
            'x': annotation.x,
            'y': annotation.y,
            'width': annotation.width,
            'height': annotation.height,
        }
