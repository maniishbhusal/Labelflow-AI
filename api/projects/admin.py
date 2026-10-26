from django.contrib import admin

from .models import Annotation, AnnotationJob, Project, ProjectImage

# Register your models here.
admin.site.register(Project)
admin.site.register(ProjectImage)
admin.site.register(AnnotationJob)
admin.site.register(Annotation)
