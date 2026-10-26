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


class AnnotationJob(models.Model):
    class Task(models.TextChoices):
        DENSE_DETECTION = 'dense_detection', 'Dense Detection'

    class Status(models.TextChoices):
        QUEUED = 'queued', 'Queued'
        RUNNING = 'running', 'Running'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'

    image = models.ForeignKey(
        ProjectImage, on_delete=models.CASCADE, related_name='annotation_jobs'
    )
    task = models.CharField(max_length=32, choices=Task.choices, default=Task.DENSE_DETECTION)
    target_labels = models.JSONField()
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.QUEUED)
    error_detail = models.TextField(blank=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ('-requested_at', '-id')

    def __str__(self):
        return f'{self.get_task_display()} for image {self.image_id}'


class Annotation(models.Model):
    class Source(models.TextChoices):
        AI = 'ai', 'AI generated'
        MANUAL = 'manual', 'Manual'

    class ReviewStatus(models.TextChoices):
        PENDING = 'pending_review', 'Pending review'
        REVIEWED = 'reviewed', 'Reviewed'

    image = models.ForeignKey(ProjectImage, on_delete=models.CASCADE, related_name='annotations')
    job = models.ForeignKey(
        AnnotationJob,
        on_delete=models.SET_NULL,
        related_name='annotations',
        null=True,
        blank=True,
    )
    label = models.CharField(max_length=255)
    x = models.PositiveIntegerField()
    y = models.PositiveIntegerField()
    width = models.PositiveIntegerField()
    height = models.PositiveIntegerField()
    source = models.CharField(max_length=16, choices=Source.choices, default=Source.AI)
    review_status = models.CharField(
        max_length=16,
        choices=ReviewStatus.choices,
        default=ReviewStatus.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('created_at', 'id')

    def __str__(self):
        return f'{self.label} on image {self.image_id}'
