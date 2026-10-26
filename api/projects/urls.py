from django.urls import path

from .views import (
    AnnotationJobDetailView,
    ImageAnnotationCollectionView,
    ImageAnnotationRequestView,
    ProjectImageCollectionView,
    ProjectImageCompleteView,
    ProjectListCreateView,
)

urlpatterns = [
    path('projects/', ProjectListCreateView.as_view(), name='project-list'),
    path(
        'images/<int:image_id>/annotate/',
        ImageAnnotationRequestView.as_view(),
        name='image-annotate',
    ),
    path('jobs/<int:job_id>/', AnnotationJobDetailView.as_view(), name='annotation-job-detail'),
    path(
        'images/<int:image_id>/annotations/',
        ImageAnnotationCollectionView.as_view(),
        name='image-annotation-list',
    ),
    path(
        'projects/<int:project_id>/images/',
        ProjectImageCollectionView.as_view(),
        name='project-image-list-create',
    ),
    path(
        'projects/<int:project_id>/images/<int:image_id>/complete/',
        ProjectImageCompleteView.as_view(),
        name='project-image-complete',
    ),
]
