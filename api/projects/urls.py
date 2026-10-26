from django.urls import path

from .views import (
    ProjectImageCollectionView,
    ProjectImageCompleteView,
    ProjectListCreateView,
)

urlpatterns = [
    path('projects/', ProjectListCreateView.as_view(), name='project-list'),
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
