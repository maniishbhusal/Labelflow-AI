from django.db import models


class Project(models.Model):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at', '-id')

    def __str__(self):
        return self.name


class ProjectImage(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending upload'
        READY = 'ready', 'Ready'
        FAILED = 'failed', 'Upload failed'

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='images')
    object_key = models.CharField(max_length=512, unique=True)
    original_filename = models.CharField(max_length=255)
    content_type = models.CharField(max_length=100)
    expected_size = models.PositiveBigIntegerField()
    file_size = models.PositiveBigIntegerField(null=True, blank=True)
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    uploaded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ('-created_at', '-id')

    def __str__(self):
        return self.original_filename

