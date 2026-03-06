from django.urls import path
from .views import RunInferenceView, InferenceResultView

urlpatterns = [
    path('<str:image_id>/run/', RunInferenceView.as_view(), name='inference-run'),
    path('<str:image_id>/',     InferenceResultView.as_view(), name='inference-result'),
]
